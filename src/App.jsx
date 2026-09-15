
import { useEffect, useRef, useState } from "react";
import { IoSunny, IoRainy, IoSnow, IoPlay, IoPause, IoVolumeMedium } from "react-icons/io5";
import bgImg from "./assets/ACNH_bg.jpg";

const WEATHER_TYPES = [
  {
    type: "Sunny",
    icon: IoSunny,
    color: "#E9B62B",
    colored: "#D7A02B",
  },
  {
    type: "Rainy",
    icon: IoRainy,
    color: "#5FA0D7",
    colored: "#3E82BB",
  },
  {
    type: "Snowy",
    icon: IoSnow,
    color: "#5DC5B9",
    colored: "#4CA89C",
  },
];

// src/assets/music 폴더의 MP3 파일 불러오기
const musicFiles = import.meta.glob(
  "/src/assets/music/**/*.mp3",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

// 현재 시간에 맞는 음악 파일 찾기
function getMusicPath(weather, hour) {
  const fileName = `${hour}.mp3`;

  const filePath = Object.keys(musicFiles).find((path) => {
    const normalizedPath = path.replace(/\\/g, "/");

    return normalizedPath.endsWith(
      `/${weather}/${fileName}`
    );
  });

  return filePath ? musicFiles[filePath] : null;
}

// 현재 시간을 00~23 형식으로 반환
function getCurrentHour() {
  return String(new Date().getHours()).padStart(2, "0");
}

export default function App() {
  const [weather, setWeather] = useState("Sunny");
  const [hour, setHour] = useState(getCurrentHour());

  // 실시간 시계
  const [currentTime, setCurrentTime] = useState(new Date());

  // 음량
  const [volume, setVolume] = useState(0.5);

  // 재생 상태
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // 오류 메시지
  const [errorMessage, setErrorMessage] = useState("");

  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const currentTrackRef = useRef("");
  const initializedRef = useRef(false);

  // 1. 실시간 시계 및 시간대 확인
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();

      setCurrentTime(now);

      const currentHour = String(
        now.getHours()
      ).padStart(2, "0");

      setHour((prev) =>
        prev === currentHour ? prev : currentHour
      );
    };

    // 처음 접속했을 때 시간 확인
    checkTime();

    // 1초마다 시계 및 시간대 확인
    const timer = setInterval(checkTime, 1000);

    // 다른 탭에서 돌아왔을 때도 시간 확인
    document.addEventListener(
      "visibilitychange",
      checkTime
    );

    return () => {
      clearInterval(timer);

      document.removeEventListener(
        "visibilitychange",
        checkTime
      );
    };
  }, []);

  // 2. 음량 조절
  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // 3. 시간 또는 날씨가 바뀌면 음악 변경
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    const musicPath = getMusicPath(weather, hour);

    // 해당 시간의 음악 파일이 없는 경우
    if (!musicPath) {
      audio.pause();

      isPlayingRef.current = false;
      setIsPlaying(false);

      setErrorMessage(
        `${weather}/${hour}.mp3 파일을 찾을 수 없습니다.`
      );

      return;
    }

    setErrorMessage("");

    // 같은 음악이면 다시 불러오지 않음
    if (currentTrackRef.current === musicPath) {
      return;
    }

    currentTrackRef.current = musicPath;

    // 새 음악 파일 설정
    audio.src = musicPath;
    audio.load();

    // 처음 접속했을 때 자동 재생 시도
    if (!initializedRef.current) {
      initializedRef.current = true;
      playAudio(audio);
      return;
    }

    // 재생 중이었다면 새 음악으로 전환
    if (isPlayingRef.current) {
      playAudio(audio);
    }

    // 일시정지 상태라면 음악만 변경하고 정지 유지
  }, [weather, hour]);

  // 4. 음악 재생
  const playAudio = async (audio) => {
    try {
      await audio.play();

      isPlayingRef.current = true;
      setIsPlaying(true);
      setAutoplayBlocked(false);
    } catch (error) {
      console.log("음악 재생 실패:", error);

      isPlayingRef.current = false;
      setIsPlaying(false);
      setAutoplayBlocked(true);
    }
  };

  // 5. 재생 / 일시정지 버튼
  const handlePlayPause = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    // 재생 중이면 일시정지
    if (isPlayingRef.current) {
      audio.pause();

      isPlayingRef.current = false;
      setIsPlaying(false);

      return;
    }

    // 재생 버튼을 누른 순간의 실제 시간 확인
    const now = new Date();

    const currentHour = String(
      now.getHours()
    ).padStart(2, "0");

    setCurrentTime(now);
    setHour(currentHour);

    // 현재 날씨와 시간에 맞는 음악 찾기
    const musicPath = getMusicPath(
      weather,
      currentHour
    );

    if (!musicPath) {
      setErrorMessage(
        `${weather}/${currentHour}.mp3 파일을 찾을 수 없습니다.`
      );

      return;
    }

    setErrorMessage("");

    // 시간이 바뀌었거나 음악이 다르면 새 파일 설정
    if (currentTrackRef.current !== musicPath) {
      currentTrackRef.current = musicPath;

      audio.src = musicPath;
      audio.load();
    }

    await playAudio(audio);
  };

  // 6. 현재 시간 표시
  const timeText = currentTime.toLocaleTimeString(
    "ko-KR",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }
  );

  return (
    <main className="music-player">
      {/* 현재 시간 */}
      <p className="current-time">
        {timeText}
      </p>

      {/* 날씨 선택 */}
      <div className="weather-buttons">
        {WEATHER_TYPES.map(({ type, icon: Icon, color, colored }) => (
          <button
            key={type}
            className={weather === type ? "active" : ""}
            onClick={() => setWeather(type)}
            style={{
              "--weather-color": color,
              "--weather-colored": colored,
            }}
          >
            <Icon className="weather-icon" size={32} />
          </button>
        ))}
      </div>

      {/* 재생 / 일시정지 */}
      <div className="player-controls">
        <button
          className="play-pause-button"
          onClick={handlePlayPause}
        >
          {isPlaying ? <IoPause size={48} /> : <IoPlay size={48} />}
        </button>
      </div>

      {/* 음량 조절 */}
      <div className="volume-control">
        <IoVolumeMedium size={32} />

        <input
          id="volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ "--progress": `${volume * 100}%` }}
        />

        <span>
          {Math.round(volume * 100)}%
        </span>
      </div>

      <div className="button-shadow"></div>

      {/* 자동 재생 차단 안내 */}
      {autoplayBlocked && !isPlaying && (
        <p className="player-message">
          브라우저에서 자동 재생이 차단되었습니다.
          재생 버튼을 눌러주세요.
        </p>
      )}

      {/* 파일 오류 안내 */}
      {errorMessage && (
        <p className="error-message">
          {errorMessage}
        </p>
      )}

      <audio
        ref={audioRef}
        loop
        preload="auto"
      />
    </main>
  );
}