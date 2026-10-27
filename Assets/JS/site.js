import { findCity, getForecast } from "./openMeteo.js";
import { renderForecast, setLocation, showError, showLoading, showStatus, updateDate } from "./weatherView.js";

const defaultLocation = { name: "København", latitude: 55.6761, longitude: 12.5683 };
let activeForecast = null;
let requestId = 0;

async function loadWeather(location) {
    const currentRequest = ++requestId;
    activeForecast = null;
    setLocation(location.name);
    showLoading();
    showStatus("");

    try {
        const forecast = await getForecast(location.latitude, location.longitude);
        if (currentRequest !== requestId) return;
        if (!forecast.current || !forecast.daily || !forecast.hourly) {
            throw new Error("Vejrudsigten indeholder ikke de forventede data.");
        }
        activeForecast = forecast;
        renderForecast(forecast);
    } catch (error) {
        if (currentRequest !== requestId) return;
        showError(error instanceof Error ? error.message : "Prøv igen om lidt.");
    }
}

function useCurrentLocation() {
    const locationRequest = ++requestId;
    if (!("geolocation" in navigator)) {
        showStatus("Din browser understøtter ikke placering. Viser vejret for København.", "info");
        loadWeather(defaultLocation);
        return;
    }

    showStatus("Finder din placering…", "info");
    navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
            if (locationRequest !== requestId) return;
            loadWeather({
                name: "Din placering",
                latitude: coords.latitude,
                longitude: coords.longitude
            });
        },
        () => {
            if (locationRequest !== requestId) return;
            showStatus("Placering ikke tilgængelig. Viser vejret for København.", "info");
            loadWeather(defaultLocation);
        },
        { enableHighAccuracy: false, maximumAge: 600_000, timeout: 8_000 }
    );
}

document.querySelector("#search-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.querySelector("#city-search");
    const cityName = input.value.trim();
    if (!cityName) return;

    const currentRequest = ++requestId;
    showStatus(`Søger efter ${cityName}…`, "info");
    try {
        const city = await findCity(cityName);
        if (currentRequest !== requestId) return;
        if (!city) {
            showStatus(`Vi kunne ikke finde "${cityName}". Prøv et andet bynavn.`, "error");
            return;
        }
        const location = {
            name: [city.name, city.admin1, city.country].filter(Boolean).join(", "),
            latitude: city.latitude,
            longitude: city.longitude
        };
        await loadWeather(location);
        input.value = "";
    } catch (error) {
        if (currentRequest === requestId) {
            showStatus(error instanceof Error ? error.message : "Byen kunne ikke søges frem.", "error");
        }
    }
});

document.querySelector("#location-button").addEventListener("click", useCurrentLocation);

document.querySelector("#forecast-list").addEventListener("click", (event) => {
    const card = event.target.closest("[data-day-index]");
    if (!card || !activeForecast) return;
    const selectedIndex = Number(card.dataset.dayIndex);
    if (!Number.isInteger(selectedIndex)) return;
    renderForecast(activeForecast, selectedIndex);
});

document.querySelector("#day-details").addEventListener("click", (event) => {
    if (event.target.closest(".details-close")) {
        document.querySelector("#day-details").hidden = true;
    }
});

updateDate();
useCurrentLocation();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
        console.error("Service worker kunne ikke registreres:", error);
    });
}
