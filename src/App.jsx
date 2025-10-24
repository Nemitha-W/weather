import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Open-Meteo endpoints
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colombo coordinates
  const lat = 6.9271;
  const lon = 79.8612;

  // Fetch weather data
  const fetchWeather = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${WEATHER_API}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,moon_phase&current_weather=true&timezone=auto`
      );
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError("Failed to load weather data");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // auto-refresh every 10 mins
    return () => clearInterval(interval);
  }, []);

  // Prepare hourly data for chart
  const hourlyData = data?.hourly?.time?.map((time, idx) => ({
    time: new Date(time).getHours() + ":00",
    temp: data.hourly.temperature_2m[idx]
  })) || [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-xl p-6 w-full max-w-2xl text-center mb-6"
      >
        <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          LakMeteo 🌦️
        </h1>

        {loading && <p>Loading weather data...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {data && data.current_weather && (
          <>
            <div className="mb-4">
              <h2 className="text-xl mb-1">Colombo, Sri Lanka</h2>
              <p className="text-5xl font-light">
                {Math.round(data.current_weather.temperature)}°C
              </p>
              <p className="text-sm opacity-80">
                Wind {data.current_weather.windspeed} km/h
              </p>
              <p className="text-sm opacity-80">
                Time: {new Date(data.current_weather.time).toLocaleTimeString()}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Hourly Temperature</h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={hourlyData}>
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis domain={['dataMin-2', 'dataMax+2']} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="temp" stroke="#7f5af0" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">7-Day Forecast</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {data.daily.temperature_2m_max.map((max, idx) => (
                  <div key={idx} className="bg-white/10 p-2 rounded-lg">
                    <p className="text-sm">
                      {new Date(data.daily.time[idx]).toLocaleDateString(undefined, { weekday: 'short' })}
                    </p>
                    <p className="text-sm opacity-80">
                      Max: {Math.round(max)}°C
                    </p>
                    <p className="text-sm opacity-80">
                      Min: {Math.round(data.daily.temperature_2m_min[idx])}°C
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
