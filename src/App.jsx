import { useState } from 'react'

function App() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [suggestions, setSuggestions] = useState([])

  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY

  const fetchWeather = async (selectedCity) => {
    const query = selectedCity || city
    if (!query) return
    setLoading(true)
    setError(null)
    setSuggestions([])
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${API_KEY}&units=imperial`
      )
      if (!response.ok) throw new Error('City not found')
      const data = await response.json()
      setWeather(data)
    } catch (err) {
      setError(err.message)
      setWeather(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuggestions = async (value) => {
    if (value.length < 2) {
      setSuggestions([])
      return
    }
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${value}&limit=5&appid=${API_KEY}`
      )
      const data = await response.json()
      setSuggestions(data)
    } catch {
      setSuggestions([])
    }
  }

  const getBackground = () => {
    const condition = weather?.weather[0].main.toLowerCase()
    if (condition === 'clear') return '#1a1a2e'
    if (condition === 'clouds') return '#2c3e50'
    if (condition === 'rain' || condition === 'drizzle') return '#1c2b3a'
    if (condition === 'snow') return '#2d3561'
    if (condition === 'thunderstorm') return '#0d0d0d'
    return '#0f0f0f'
  }

  return (
    <div className="app" style={{ background: getBackground() }}>
      <h1>Weather App</h1>
      <div className="search">
        <input
          type="text"
          placeholder="Enter a city..."
          value={city}
          onChange={(e) => {
            setCity(e.target.value)
            fetchSuggestions(e.target.value)
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') fetchWeather() }}
        />
        <button onClick={fetchWeather}>Search</button>
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="suggestion-item"
              onClick={() => {
                setCity(s.name)
                setSuggestions([])
                fetchWeather(s.name)
              }}
            >
              {s.name}, {s.state ? s.state + ', ' : ''}{s.country}
            </div>
          ))}
        </div>
      )}

      {loading && <p className="message">Loading...</p>}
      {error && <p className="message error">{error}</p>}

      {weather && (
        <div className="weather-card">
          <h2>{weather.name}, {weather.sys.country}</h2>
          <img
            src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
            alt={weather.weather[0].description}
          />
          <p className="temp">{Math.round(weather.main.temp)}°F</p>
          <p className="description">{weather.weather[0].description}</p>
          <div className="details">
            <div className="humidity-bar">
              <span>Humidity</span>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${weather.main.humidity}%` }}></div>
              </div>
              <span>{weather.main.humidity}%</span>
            </div>
            <span>Wind: {weather.wind.speed} mph</span>
            <span>Feels like: {Math.round(weather.main.feels_like)}°F</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default App