const forecastEndpoint = "https://api.open-meteo.com/v1/forecast";
const geocodingEndpoint = "https://geocoding-api.open-meteo.com/v1/search";

async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Open-Meteo svarede med status ${response.status}.`);
    }
    return response.json();
}

export async function getForecast(latitude, longitude) {
    const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: [
            "temperature_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "rain",
            "showers",
            "snowfall",
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m",
            "wind_gusts_10m"
        ].join(","),
        hourly: [
            "temperature_2m",
            "apparent_temperature",
            "precipitation_probability",
            "precipitation",
            "rain",
            "showers",
            "snowfall",
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m"
        ].join(","),
        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "sunrise",
            "sunset",
            "precipitation_sum",
            "rain_sum",
            "showers_sum",
            "snowfall_sum",
            "wind_speed_10m_max",
            "wind_direction_10m_dominant"
        ].join(","),
        forecast_days: "5",
        timezone: "auto",
        temperature_unit: "celsius",
        wind_speed_unit: "kmh",
        precipitation_unit: "mm"
    });

    return getJson(`${forecastEndpoint}?${params}`);
}

export async function findCity(name) {
    const params = new URLSearchParams({
        name,
        count: "1",
        language: "da",
        format: "json"
    });
    const data = await getJson(`${geocodingEndpoint}?${params}`);
    return data.results?.[0] ?? null;
}
