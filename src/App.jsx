
import { useEffect, useRef, useState } from "react";

const WEATHER_TYPES = ["Sunny", "Rainy", "Snowy"];

function getCurrentHour() {
  return String(new Date().getHours()).padStart(2, "0");
}

export default function App() {
  const [weather, setWeather] = useState("Sunny");
  const [hour, setHour] = useState(getCurrentHour());
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);
  const currentTrackRef = useRef("");

  // 1. 실제 시간 확인
  useEffect(() => {
    const checkTime = () => {
      const currentHour = getCurrentHour();
      setHour((prev) =>
        prev === currentHour ? prev : currentHour
      );
    };

    // 페이지에 처음 들어왔을 때 확인
    checkTime();

    // 15초마다 시간 확인
    const timer = setInterval(checkTime, 15000);

    // 백그라운드에서 돌아온 경우에도 확인
    document.addEventListener("visibilitychange", checkTime);

    return () => {
      clearInterval(timer);
      document.removeEventListener(
        "visibilitychange",
        checkTime
      );
    };
  }, []);

  // 2. 시간 또는 날씨가 바뀌면 음악 변경
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const track = `/music/${weather}/${hour}.mp3`;

    // 같은 음악이면 다시 시작하지 않음
    if (currentTrackRef.current === track) return;

    currentTrackRef.current = track;

    audio.src = track;
    audio.load();

    if (isPlaying) {
      audio.play().catch((error) => {
        console.log("음악 재생 실패:", error);
        setIsPlaying(false);
      });
    }
  }, [weather, hour, isPlaying]);

  // 3. 재생 버튼
  const handlePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.log("음악 재생 실패:", error);
    }
  };

  // 4. 일시정지 버튼
  const handlePause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  return (
    <main className="music-player">
      <p className="current-time">
        {hour}:00
      </p>

      <div className="weather-buttons">
        {WEATHER_TYPES.map((type) => (
          <button
            key={type}
            className={
              weather === type ? "active" : ""
            }
            onClick={() => setWeather(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="player-controls">
        {isPlaying ? (
          <button onClick={handlePause}>
            Pause
          </button>
        ) : (
          <button onClick={handlePlay}>
            Play
          </button>
        )}
      </div>

      <audio
        ref={audioRef}
        loop
        preload="auto"
      />
    </main>
  );
}