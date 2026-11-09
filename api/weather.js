// Vercel Serverless Function: Real-Time Global Weather Connector (Open-Meteo)
const WMO_CODES = {
  0: 'Clear sky ☀️',
  1: 'Mainly clear 🌤️',
  2: 'Partly cloudy ⛅',
  3: 'Overcast ☁️',
  45: 'Foggy 🌫️',
  48: 'Depositing rime fog 🌫️',
  51: 'Light drizzle 🌦️',
  53: 'Moderate drizzle 🌦️',
  55: 'Dense drizzle 🌧️',
  61: 'Slight rain 🌧️',
  63: 'Moderate rain 🌧️',
  65: 'Heavy rain 🌧️',
  71: 'Slight snow 🌨️',
  73: 'Moderate snow 🌨️',
  75: 'Heavy snow ❄️',
  80: 'Slight rain showers 🌦️',
  81: 'Moderate rain showers 🌧️',
  82: 'Violent rain showers ⛈️',
  95: 'Thunderstorm ⛈️',
  96: 'Thunderstorm with slight hail ⛈️',
  99: 'Thunderstorm with heavy hail ⛈️'
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const city = (req.query.city || (req.body && req.body.city) || 'Delhi').trim();

  try {
    // 1. Geocode city name to lat/lng
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoResp = await fetch(geoUrl);
    const geoData = await geoResp.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({
        success: false,
        error: `City "${city}" not found.`
      });
    }

    const loc = geoData.results[0];
    const { latitude, longitude, name, country } = loc;

    // 2. Fetch current weather
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
    const wResp = await fetch(weatherUrl);
    const wData = await wResp.json();
    const curr = wData.current;

    const condition = WMO_CODES[curr.weather_code] || 'Clear';

    return res.status(200).json({
      success: true,
      city: `${name}, ${country || ''}`.trim(),
      temperature: `${curr.temperature_2m}°C`,
      feelsLike: `${curr.apparent_temperature}°C`,
      humidity: `${curr.relative_humidity_2m}%`,
      windSpeed: `${curr.wind_speed_10m} km/h`,
      condition,
      timestamp: curr.time
    });
  } catch (error) {
    console.error('Weather connector error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve weather data: ' + error.message
    });
  }
};
