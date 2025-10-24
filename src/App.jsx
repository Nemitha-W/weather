import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const API_URL = "https://api.open-meteo.com/v1/forecast";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeTab, setActiveTab] = useState("hourly");

  // Colombo coordinates
  const lat = 6.9271;
  const lon = 79.8612;

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,relative_humidity_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,weathercode&current_weather=true&timezone=Asia%2FColombo`
      );
      if (!res.ok) throw new Error("Network response was not ok");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError("Failed to load weather data. Please refresh.");
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // auto-refresh 10 min
    return () => clearInterval(interval);
  }, []);

  // Get weather icon based on weather code
  const getWeatherIcon = (code) => {
    const iconMap = {
      0: "☀️", // Clear sky
      1: "🌤️", // Mainly clear
      2: "⛅", // Partly cloudy
      3: "☁️", // Overcast
      45: "🌫️", // Fog
      48: "🌫️", // Depositing rime fog
      51: "🌦️", // Drizzle light
      53: "🌦️", // Drizzle moderate
      55: "🌦️", // Drizzle dense
      56: "🌨️", // Freezing Drizzle light
      57: "🌨️", // Freezing Drizzle dense
      61: "🌧️", // Rain slight
      63: "🌧️", // Rain moderate
      65: "🌧️", // Rain heavy
      66: "🌨️", // Freezing Rain light
      67: "🌨️", // Freezing Rain heavy
      71: "🌨️", // Snow fall slight
      73: "🌨️", // Snow fall moderate
      75: "🌨️", // Snow fall heavy
      77: "🌨️", // Snow grains
      80: "🌦️", // Rain showers slight
      81: "🌦️", // Rain showers moderate
      82: "🌦️", // Rain showers violent
      85: "🌨️", // Snow showers slight
      86: "🌨️", // Snow showers heavy
      95: "⛈️", // Thunderstorm slight
      96: "⛈️", // Thunderstorm moderate
      99: "⛈️", // Thunderstorm heavy
    };
    return iconMap[code] || "🌡️";
  };

  // Get weather description based on weather code
  const getWeatherDescription = (code) => {
    const descMap = {
      0: "Clear Sky",
      1: "Mainly Clear",
      2: "Partly Cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Depositing Rime Fog",
      51: "Light Drizzle",
      53: "Moderate Drizzle",
      55: "Dense Drizzle",
      56: "Light Freezing Drizzle",
      57: "Dense Freezing Drizzle",
      61: "Light Rain",
      63: "Moderate Rain",
      65: "Heavy Rain",
      66: "Light Freezing Rain",
      67: "Heavy Freezing Rain",
      71: "Light Snow",
      73: "Moderate Snow",
      75: "Heavy Snow",
      77: "Snow Grains",
      80: "Light Rain Showers",
      81: "Moderate Rain Showers",
      82: "Violent Rain Showers",
      85: "Light Snow Showers",
      86: "Heavy Snow Showers",
      95: "Light Thunderstorm",
      96: "Moderate Thunderstorm",
      99: "Heavy Thunderstorm",
    };
    return descMap[code] || "Unknown";
  };

  // Format time from string
  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format date from string
  const formatDate = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Prepare hourly chart data
  const hourlyData =
    data?.hourly?.time?.map((time, idx) => ({
      time: new Date(time).getHours() + ":00",
      temp: data.hourly.temperature_2m[idx],
      precipitation: data.hourly.precipitation_probability[idx],
      humidity: data.hourly.relative_humidity_2m[idx],
    })) || [];

  // Prepare daily chart data
  const dailyData =
    data?.daily?.time?.map((time, idx) => ({
      day: new Date(time).toLocaleDateString("en-US", { weekday: "short" }),
      max: data.daily.temperature_2m_max[idx],
      min: data.daily.temperature_2m_min[idx],
      precipitation: data.daily.precipitation_probability_max[idx],
    })) || [];

  // Get current day index
  const getCurrentDayIndex = () => {
    if (!data?.daily?.time) return 0;
    const today = new Date().setHours(0, 0, 0, 0);
    return data.daily.time.findIndex(
      (time) => new Date(time).setHours(0, 0, 0, 0) === today
    );
  };

  // Get hourly data for selected day
  const getSelectedDayHourlyData = () => {
    if (!data?.hourly?.time) return [];
    const dayIndex = selectedDay || getCurrentDayIndex();
    const startHour = dayIndex * 24;
    const endHour = startHour + 24;
    
    return data.hourly.time.slice(startHour, endHour).map((time, idx) => ({
      time: new Date(time).getHours() + ":00",
      temp: data.hourly.temperature_2m[startHour + idx],
      precipitation: data.hourly.precipitation_probability[startHour + idx],
      humidity: data.hourly.relative_humidity_2m[startHour + idx],
      weathercode: data.hourly.weathercode[startHour + idx],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              LakMeteo 🌦️
            </h1>
            <button
              onClick={fetchWeather}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6"
            >
              <p className="text-red-300">{error}</p>
            </motion.div>
          )}

          {loading && !data && (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {data && data.current_weather && (
            <>
              {/* Current Weather Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-1">Colombo, Sri Lanka</h2>
                      <p className="text-sm opacity-80">
                        {new Date().toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-5xl">
                      {getWeatherIcon(data.current_weather.weathercode)}
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-6xl font-light">
                        {Math.round(data.current_weather.temperature)}°C
                      </p>
                      <p className="text-lg opacity-80 mt-1">
                        {getWeatherDescription(data.current_weather.weathercode)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-80">Wind</p>
                      <p className="text-xl font-semibold">{data.current_weather.windspeed} km/h</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Today's Highlights</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-sm opacity-80 mb-1">Humidity</p>
                      <p className="text-2xl font-semibold">
                        {data.hourly.relative_humidity_2m[0]}%
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-sm opacity-80 mb-1">Precipitation</p>
                      <p className="text-2xl font-semibold">
                        {data.daily.precipitation_probability_max[0]}%
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-sm opacity-80 mb-1">Sunrise</p>
                      <p className="text-xl font-semibold">
                        {formatTime(data.daily.sunrise[0])}
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-sm opacity-80 mb-1">Sunset</p>
                      <p className="text-xl font-semibold">
                        {formatTime(data.daily.sunset[0])}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-2 mb-6 border-b border-white/20">
                <button
                  onClick={() => setActiveTab("hourly")}
                  className={`pb-2 px-4 font-medium transition-colors ${
                    activeTab === "hourly"
                      ? "text-white border-b-2 border-white"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  Hourly Forecast
                </button>
                <button
                  onClick={() => setActiveTab("daily")}
                  className={`pb-2 px-4 font-medium transition-colors ${
                    activeTab === "daily"
                      ? "text-white border-b-2 border-white"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  7-Day Forecast
                </button>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === "hourly" && (
                  <motion.div
                    key="hourly"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Day Selector */}
                    <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                      {data.daily.time.map((time, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedDay(idx)}
                          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                            selectedDay === idx
                              ? "bg-white/20 text-white"
                              : "bg-white/10 text-white/70 hover:bg-white/15"
                          }`}
                        >
                          {idx === 0 ? "Today" : formatDate(time)}
                        </button>
                      ))}
                    </div>

                    {/* Hourly Chart */}
                    <div className="bg-white/5 rounded-2xl p-4 mb-6">
                      <h3 className="text-lg font-semibold mb-4">Temperature & Precipitation</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={getSelectedDayHourlyData()}>
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                          <YAxis domain={['dataMin-2', 'dataMax+2']} tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(0, 0, 0, 0.8)",
                              border: "none",
                              borderRadius: "8px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="temp"
                            stroke="#7f5af0"
                            fill="#7f5af0"
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Hourly Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {getSelectedDayHourlyData().map((hour, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/15 transition-colors"
                        >
                          <p className="text-sm font-medium">{hour.time}</p>
                          <div className="text-2xl my-2">{getWeatherIcon(hour.weathercode)}</div>
                          <p className="text-lg font-semibold">{Math.round(hour.temp)}°</p>
                          <div className="flex justify-center items-center mt-1 space-x-2">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
                              </svg>
                              <span className="text-xs">{hour.precipitation}%</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "daily" && (
                  <motion.div
                    key="daily"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Daily Chart */}
                    <div className="bg-white/5 rounded-2xl p-4 mb-6">
                      <h3 className="text-lg font-semibold mb-4">Temperature Range</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={dailyData}>
                          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                          <YAxis domain={['dataMin-2', 'dataMax+2']} tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(0, 0, 0, 0.8)",
                              border: "none",
                              borderRadius: "8px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="max"
                            stroke="#ff6b6b"
                            fill="#ff6b6b"
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="min"
                            stroke="#4dabf7"
                            fill="#4dabf7"
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Daily Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.daily.time.map((time, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="bg-white/10 rounded-xl p-4 hover:bg-white/15 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium">
                                {idx === 0 ? "Today" : formatDate(time)}
                              </p>
                              <p className="text-sm opacity-80">
                                {new Date(time).toLocaleDateString("en-US", {
                                  weekday: "long",
                                })}
                              </p>
                            </div>
                            <div className="text-3xl">
                              {getWeatherIcon(data.daily.weathercode[idx])}
                            </div>
                          </div>
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center">
                              <span className="text-red-400 mr-1">↑</span>
                                                     <span className="text-lg font-semibold">
                                {Math.round(data.daily.temperature_2m_max[idx])}°
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-blue-400 mr-1">↓</span>
                              <span className="text-lg font-semibold">
                                {Math.round(data.daily.temperature_2m_min[idx])}°
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
                              </svg>
                              <span>{data.daily.precipitation_probability_max[idx]}%</span>
                            </div>
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <span>{formatTime(data.daily.sunrise[idx])}</span>
                            </div>
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                              </svg>
                              <span>{formatTime(data.daily.sunset[idx])}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-sm opacity-70"
        >
          <p>Weather data provided by Open-Meteo</p>
          <p className="mt-1">Last updated: {data ? new Date().toLocaleTimeString() : "Never"}</p>
        </motion.div>
      </div>
    </div>
  );
                    }
