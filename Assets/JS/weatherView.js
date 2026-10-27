const weatherDescriptions = {
    0: ["Klart", "☀️"],
    1: ["Overvejende klart", "🌤️"],
    2: ["Delvist skyet", "⛅"],
    3: ["Overskyet", "☁️"],
    45: ["Tåge", "🌫️"],
    48: ["Rimtåge", "🌫️"],
    51: ["Let støvregn", "🌦️"],
    53: ["Støvregn", "🌦️"],
    55: ["Kraftig støvregn", "🌧️"],
    56: ["Let isslag", "🌧️"],
    57: ["Kraftigt isslag", "🌧️"],
    61: ["Let regn", "🌧️"],
    63: ["Regn", "🌧️"],
    65: ["Kraftig regn", "🌧️"],
    66: ["Let underafkølet regn", "🌧️"],
    67: ["Kraftig underafkølet regn", "🌧️"],
    71: ["Let sne", "🌨️"],
    73: ["Sne", "🌨️"],
    75: ["Kraftig sne", "❄️"],
    77: ["Snekorn", "🌨️"],
    80: ["Lette regnbyger", "🌦️"],
    81: ["Regnbyger", "🌧️"],
    82: ["Kraftige regnbyger", "🌧️"],
    85: ["Lette snebyger", "🌨️"],
    86: ["Kraftige snebyger", "❄️"],
    95: ["Tordenvejr", "⛈️"],
    96: ["Torden og let hagl", "⛈️"],
    99: ["Torden og kraftigt hagl", "⛈️"]
};

const directions = ["N", "NØ", "Ø", "SØ", "S", "SV", "V", "NV"];
const dayFormatter = new Intl.DateTimeFormat("da-DK", { weekday: "long", day: "numeric", month: "long" });
const shortDayFormatter = new Intl.DateTimeFormat("da-DK", { weekday: "short" });

function weatherFor(code) {
    return weatherDescriptions[code] ?? ["Ukendt vejr", "🌡️"];
}

function degreesToDirection(degrees) {
    return directions[Math.round(degrees / 45) % directions.length];
}

function formatNumber(value, digits = 0) {
    return Number.isFinite(value)
        ? new Intl.NumberFormat("da-DK", { maximumFractionDigits: digits }).format(value)
        : "—";
}

function formatDate(dateString, options = { weekday: "long", day: "numeric", month: "long" }) {
    return new Intl.DateTimeFormat("da-DK", options).format(new Date(`${dateString}T12:00:00`));
}

function precipitationSummary(rain, showers, snow) {
    const parts = [];
    if (rain > 0) parts.push(`regn ${formatNumber(rain, 1)} mm`);
    if (showers > 0) parts.push(`byger ${formatNumber(showers, 1)} mm`);
    if (snow > 0) parts.push(`sne ${formatNumber(snow, 1)} cm`);
    return parts.length ? parts.join(" · ") : "Ingen nedbør";
}

export function updateDate() {
    document.querySelector("#today-date").textContent = new Intl.DateTimeFormat("da-DK", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(new Date());
}

export function setLocation(name) {
    document.querySelector("#location-name").textContent = name;
}

export function showStatus(message = "", kind = "info") {
    const status = document.querySelector("#status-message");
    status.textContent = message;
    status.className = `status-message${message ? ` status-message--${kind}` : ""}`;
    status.hidden = !message;
}

export function showLoading() {
    document.querySelector("#current-weather").innerHTML = `
        <div class="loading-state">
            <span class="loading-state__spinner" aria-hidden="true"></span>
            <p>Henter vejrudsigten…</p>
        </div>`;
}

export function showError(message) {
    document.querySelector("#current-weather").innerHTML = `
        <div class="error-state">
            <span class="error-state__icon" aria-hidden="true">!</span>
            <div><h2>Vejret kunne ikke hentes</h2><p></p></div>
        </div>`;
    document.querySelector(".error-state p").textContent = message;
    document.querySelector("#forecast-list").replaceChildren();
    document.querySelector("#day-details").hidden = true;
}

function renderCurrentWeather(data) {
    const current = data.current;
    const [description, icon] = weatherFor(current.weather_code);
    const apparentTemp = formatNumber(current.apparent_temperature);
    const windDirection = degreesToDirection(current.wind_direction_10m);

    document.querySelector("#current-weather").innerHTML = `
        <div class="current-weather__main">
            <div class="current-weather__summary">
                <span class="current-weather__icon" role="img" aria-label="${description}">${icon}</span>
                <div>
                    <p class="current-weather__condition">${description}</p>
                    <p class="current-weather__feels">Føles som ${apparentTemp}°</p>
                </div>
            </div>
            <p class="current-weather__temperature">${formatNumber(current.temperature_2m)}<span>°</span></p>
        </div>
        <div class="weather-stats">
            <div class="weather-stat">
                <span class="weather-stat__icon" aria-hidden="true">↗</span>
                <div><span class="weather-stat__label">Vind</span><strong>${formatNumber(current.wind_speed_10m)} <small>km/t</small></strong></div>
                <span class="weather-stat__detail">${windDirection} · ${formatNumber(current.wind_direction_10m)}°</span>
            </div>
            <div class="weather-stat">
                <span class="weather-stat__icon" aria-hidden="true">☂</span>
                <div><span class="weather-stat__label">Nedbør lige nu</span><strong>${formatNumber(current.precipitation, 1)} <small>mm</small></strong></div>
                <span class="weather-stat__detail">${precipitationSummary(current.rain, current.showers, current.snowfall)}</span>
            </div>
            <div class="weather-stat">
                <span class="weather-stat__icon" aria-hidden="true">≋</span>
                <div><span class="weather-stat__label">Vindstød</span><strong>${formatNumber(current.wind_gusts_10m)} <small>km/t</small></strong></div>
                <span class="weather-stat__detail">Målt i 10 meters højde</span>
            </div>
        </div>`;

    document.querySelector("#updated-at").textContent = `Opdateret kl. ${new Intl.DateTimeFormat("da-DK", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date())}`;
}

function renderDayDetails(data, index) {
    const day = data.daily;
    const date = day.time[index];
    const hourly = data.hourly;
    const hourIndices = hourly.time.reduce((indices, value, hourIndex) => {
        if (value.startsWith(date)) indices.push(hourIndex);
        return indices;
    }, []);

    const rows = hourIndices
        .filter((hourIndex) => {
            const hour = Number(hourly.time[hourIndex].slice(11, 13));
            return hour >= 6 && hour <= 23;
        })
        .map((hourIndex) => {
            const [description, icon] = weatherFor(hourly.weather_code[hourIndex]);
            const direction = degreesToDirection(hourly.wind_direction_10m[hourIndex]);
            return `
                <div class="hour-row">
                    <span class="hour-row__time">${hourly.time[hourIndex].slice(11, 16)}</span>
                    <span class="hour-row__weather" role="img" aria-label="${description}">${icon}</span>
                    <span class="hour-row__temperature">${formatNumber(hourly.temperature_2m[hourIndex])}°</span>
                    <span class="hour-row__rain">☂ ${formatNumber(hourly.precipitation_probability[hourIndex])}%</span>
                    <span class="hour-row__wind">↗ ${formatNumber(hourly.wind_speed_10m[hourIndex])} km/t ${direction}</span>
                </div>`;
        }).join("");

    const panel = document.querySelector("#day-details");
    panel.innerHTML = `
        <div class="day-details__heading">
            <div>
                <p class="eyebrow">DØGNPROGNOSE</p>
                <h2>${formatDate(date)}</h2>
            </div>
            <button type="button" class="details-close" aria-label="Luk dagsdetaljer">×</button>
        </div>
        <div class="day-summary">
            <div class="day-summary__weather"><span role="img" aria-label="${weatherFor(day.weather_code[index])[0]}">${weatherFor(day.weather_code[index])[1]}</span>
                <strong>${weatherFor(day.weather_code[index])[0]}</strong></div>
            <span>Højeste <strong>${formatNumber(day.temperature_2m_max[index])}°</strong></span>
            <span>Laveste <strong>${formatNumber(day.temperature_2m_min[index])}°</strong></span>
            <span>Vind <strong>${formatNumber(day.wind_speed_10m_max[index])} km/t · ${degreesToDirection(day.wind_direction_10m_dominant[index])}</strong></span>
            <span>Nedbør <strong>${precipitationSummary(day.rain_sum[index], day.showers_sum[index], day.snowfall_sum[index])}</strong></span>
        </div>
        <h3 class="hourly-title">Time for time</h3>
        <div class="hourly-list">${rows || '<p class="hourly-empty">Ingen timedata for denne dag.</p>'}</div>`;
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function renderForecast(data, selectedIndex = 0) {
    renderCurrentWeather(data);

    const day = data.daily;
    document.querySelector("#forecast-list").innerHTML = day.time.map((date, index) => {
        const [description, icon] = weatherFor(day.weather_code[index]);
        const isToday = index === 0;
        const selected = index === selectedIndex;
        return `
            <button class="forecast-card${selected ? " forecast-card--selected" : ""}" type="button"
                data-day-index="${index}" aria-pressed="${selected}" aria-label="${formatDate(date)}: ${description}, højeste ${formatNumber(day.temperature_2m_max[index])} grader">
                <span class="forecast-card__day">${isToday ? "I dag" : shortDayFormatter.format(new Date(`${date}T12:00:00`))}</span>
                <span class="forecast-card__date">${formatDate(date, { day: "numeric", month: "short" })}</span>
                <span class="forecast-card__icon" role="img" aria-label="${description}">${icon}</span>
                <span class="forecast-card__condition">${description}</span>
                <span class="forecast-card__temperatures"><strong>${formatNumber(day.temperature_2m_max[index])}°</strong><span>${formatNumber(day.temperature_2m_min[index])}°</span></span>
                <span class="forecast-card__rain">☂ ${formatNumber(day.precipitation_sum[index], 1)} mm</span>
                <span class="forecast-card__wind">↗ ${formatNumber(day.wind_speed_10m_max[index])} km/t ${degreesToDirection(day.wind_direction_10m_dominant[index])}</span>
            </button>`;
    }).join("");

    renderDayDetails(data, selectedIndex);
}
