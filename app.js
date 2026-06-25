const YEAR = 2026;
const START = `${YEAR}-07-04`;
const END = `${YEAR}-07-11`;
// Open-Meteo nie pozwala pytać o dni poza zakresem prognozy.
// Zakres zwykle kończy się ok. 15 dni od dzisiaj, więc przycinamy zapytanie,
// a brakujące dni pokazujemy jako niedostępne zamiast wywalać cały request.
const API_END = minIsoDate(END, addDaysIso(new Date(), 15));
const CACHE_TTL_MS = 60 * 60 * 1000;

const routePoints = [
  { name: "Wisła", km: 0, lat: 49.6540, lon: 18.8591 },
  { name: "Wały Goczały", km: 62, lat: 49.913929, lon: 18.791301 },
  { name: "Oświęcim", km: 121, lat: 50.0344, lon: 19.2104 },
  { name: "Kraków", km: 160, lat: 50.0647, lon: 19.9450 },
  { name: "Opatowiec", km: 295, lat: 50.2436, lon: 20.7234 },
  { name: "Sandomierz", km: 437, lat: 50.6827, lon: 21.7489 },
  { name: "Kazimierz Dolny", km: 528, lat: 51.3223, lon: 21.9476 },
  { name: "Dęblin", km: 566, lat: 51.5591, lon: 21.8483 },
  { name: "Warszawa", km: 680, lat: 52.2297, lon: 21.0122 },
  { name: "Płock", km: 816, lat: 52.5468, lon: 19.7064 },
  { name: "Włocławek", km: 870, lat: 52.6483, lon: 19.0677 },
  { name: "Toruń", km: 925, lat: 53.0138, lon: 18.5984 },
  { name: "Grudziądz", km: 1030, lat: 53.4837, lon: 18.7536 },
  { name: "Tczew", km: 1116, lat: 54.0924, lon: 18.7779 },
  { name: "Gdańsk", km: 1178, lat: 54.3520, lon: 18.6466 }
];

const shops = [
  [54, "Drogomyśl", "Sklep EMI"], [73, "Chybie", "Lewiatan, Intermarche"], [109, "Góra", "Żabka"],
  [119, "Harmęże", "Sklep Euro"], [123, "Oświęcim", "Delikatesy Centrum"], [142, "Mętków", "Sklep Wisełka"],
  [159, "Okleśna", "Sklepy spożywcze"], [181, "Facimiech", "Sklep spożywczy"], [195, "Kraków", "Żabka, KFC, BP"],
  [207, "Kraków", "Żabka"], [209, "Kraków", "Biedronka, Carrefour Express, budki"], [212, "Kraków", "Orlen Kazimierz"],
  [214, "Kraków", "Biedronka"], [227, "Brzegi", "Sklep spożywczy"], [234, "Niepołomice", "Zwał jak zwał, Orlen, Netto"],
  [310, "Wietrzychowice", "Cezar Delikatesy"], [316, "Żabno", "Stacja Aramco"], [322, "Nieciecza", "Sklep spożywczy"],
  [358, "Szczucin", "Orlen"], [360, "Rataje Słupskie", "Orlen"], [436, "Sandomierz", "Circle, Carrefour Express, Żabka, budki, knajpy, Orlen"],
  [459, "Zawichost", "Żabka"], [471, "Annopol", "Biedronka, Spar, Lewiatan, knajpy"], [489, "Józefów", "Orlen, sklep spożywczy, Biedronka"],
  [514, "Kępa Chotecka", "Odido"], [518, "Urządków", "Euro Sklep"], [529, "Kazimierz Dolny", "Budki, Lewiatan, Orlen"],
  [543, "Puławy", "Biedronka, McDonald's"], [565, "Dęblin", "Lidl, Orlen"], [581, "Pawłowice", "Sklep ostatni"],
  [624, "Wilga", "Bar Wilga"], [645, "Radwanków Szlachecki", "Artus"], [667, "Józefów", "Moya"],
  [679, "Warszawa", "Circle, Biedronka, BP"], [688, "Warszawa", "Orlen"], [702, "Warszawa", "Biedronka, Lidl"],
  [725, "Nowy Dwór Maz.", "McDonald's, MOL"], [760, "Czerwińsk nad Wisłą", "Dino, Lewiatan"], [769, "Wyszogród", "Delikatesy Centrum, Żabka, sklepy"],
  [780, "Wyszogród", "Pitstop Podgórze"], [798, "Wykowo", "Lewiatan"], [810, "Płock", "Lewiatan"],
  [816, "Płock", "Żabka, budki, market, Netto, Lidl"], [823, "Maszewo", "Dino, Lewiatan"], [847, "Dobrzyń nad Wisłą", "Delikatesy Centrum, Biedronka, Dino"],
  [871, "Włocławek", "Lewiatan"], [885, "Bobrowniki", "Lewiatan"], [914, "Silno", "Żabka"],
  [916, "Grabowiec", "Dino"], [920, "Toruń", "Biedronka"], [965, "Strzyżawa", "Artus"],
  [968, "Ostromecko", "Żabka"], [1002, "Chełmno", "Biedronka, Żabka, budki"], [1028, "Grudziądz", "Biedronka"],
  [1035, "Grudziądz", "Orlen"], [1075, "Opalenie", "Sklep spożywczy"], [1084, "Gniew", "Dino"],
  [1105, "Mała Słońca", "Sklep spożywczy"], [1111, "Knybawa", "MOL"], [1161, "Sobieszewo", "Sklep Kami, Żabka"],
  [1168, "Przejazdowo", "Lidl, Biedronka"], [1180, "Gdańsk", "Meta"]
];

const dateSelect = document.querySelector("#dateSelect");
const refreshButton = document.querySelector("#refreshButton");
const clearCacheButton = document.querySelector("#clearCacheButton");
const statusEl = document.querySelector("#status");
const forecastEl = document.querySelector("#forecast");
const shopsListEl = document.querySelector("#shopsList");
let forecasts = [];

init();

function init() {
  initTabs();
  renderShops();
  buildDateOptions();
  dateSelect.addEventListener("change", () => loadForecastsForDay(dateSelect.value));
  refreshButton.addEventListener("click", () => {
    if (dateSelect.value) loadForecastsForDay(dateSelect.value, { forceRefresh: true });
  });
  clearCacheButton.addEventListener("click", clearWeatherCache);

  const defaultDate = defaultSelectedDate();
  dateSelect.value = defaultDate;
  loadForecastsForDay(defaultDate);
}

function initTabs() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;
      document.querySelectorAll("[data-tab]").forEach((item) => item.classList.toggle("active", item === button));
      document.querySelector("#weatherPanel").classList.toggle("active", tab === "weather");
      document.querySelector("#shopsPanel").classList.toggle("active", tab === "shops");
    });
  });
}

function renderShops() {
  shopsListEl.innerHTML = shops.map(([km, town, description]) => `
    <article class="shop-item">
      <span class="shop-km">${km} km</span>
      <strong class="shop-town">${town}</strong>
      <span class="shop-desc">${description}</span>
    </article>
  `).join("");
}

function defaultSelectedDate() {
  const today = toIsoDate(new Date());
  return today >= START && today <= END ? today : START;
}

function buildDateOptions() {
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Wybierz dzień";
  placeholder.selected = true;
  placeholder.disabled = true;
  dateSelect.appendChild(placeholder);

  const start = new Date(`${START}T00:00:00`);
  for (let i = 0; i < 8; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = toIsoDate(date);
    const option = document.createElement("option");
    option.value = iso;
    option.textContent = formatDate(iso);
    dateSelect.appendChild(option);
  }
}

async function loadForecastsForDay(date, options = {}) {
  statusEl.className = "status";
  forecastEl.innerHTML = "";

  if (!options.forceRefresh) {
    const cached = readCachedForecast(date);
    if (cached) {
      forecasts = cached;
      renderSelectedDay();
      statusEl.textContent = `Dane z pamięci przeglądarki dla ${formatDate(date)}. Odświeżenie wymusi nowe pobranie.`;
      return;
    }
  }

  if (date > API_END) {
    forecasts = [];
    statusEl.className = "status warning";
    statusEl.textContent = "Prognoza dla tego dnia nie jest jeszcze dostępna w API.";
    routePoints
      .map((point) => ({ point, available: false }))
      .forEach((card) => forecastEl.appendChild(renderCard(card)));
    return;
  }

  statusEl.textContent = `Ładowanie danych Open-Meteo dla ${formatDate(date)}…`;

  try {
    forecasts = await loadRouteForecast(date);
    writeCachedForecast(date, forecasts);
    renderSelectedDay();
    statusEl.textContent = `Dane z Open-Meteo dla ${formatDate(date)}. Ostatnie odświeżenie: ${new Date().toLocaleString("pl-PL")}.`;
  } catch (error) {
    console.error(error);
    statusEl.className = "status error";
    statusEl.textContent = "Nie udało się pobrać pogody. Spróbuj odświeżyć za chwilę.";
  }
}

async function loadRouteForecast(date) {
  const params = new URLSearchParams({
    latitude: routePoints.map((point) => point.lat).join(","),
    longitude: routePoints.map((point) => point.lon).join(","),
    timezone: "Europe/Warsaw",
    start_date: date,
    end_date: date,
    hourly: [
      "temperature_2m",
      "precipitation",
      "precipitation_probability",
      "rain",
      "showers",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m"
    ].join(","),
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "rain_sum",
      "wind_speed_10m_max",
      "wind_gusts_10m_max"
    ].join(",")
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
  const data = await response.json();
  const locations = Array.isArray(data) ? data : [data];

  return routePoints.map((point, index) => ({
    point,
    data: locations[index]
  }));
}

function renderSelectedDay() {
  const date = dateSelect.value;
  const cards = forecasts.map((forecast) => buildPointDay(forecast.point, forecast.data, date));

  forecastEl.innerHTML = "";
  cards.forEach((card) => forecastEl.appendChild(renderCard(card)));

  if (cards.every((card) => !card.available)) {
    statusEl.className = "status warning";
    statusEl.textContent = "Prognoza dla tego dnia nie jest jeszcze dostępna w API.";
  }
}

function buildPointDay(point, data, date) {
  const dailyIndex = data.daily?.time?.indexOf(date) ?? -1;
  const hourly = [];

  data.hourly?.time?.forEach((time, index) => {
    if (time.slice(0, 10) !== date) return;
    hourly.push({
      time: time.slice(11, 16),
      temperature: data.hourly.temperature_2m[index],
      precipitation: data.hourly.precipitation[index],
      rain: data.hourly.rain[index],
      showers: data.hourly.showers[index],
      precipitationProbability: data.hourly.precipitation_probability[index],
      windSpeed: data.hourly.wind_speed_10m[index],
      windGusts: data.hourly.wind_gusts_10m[index],
      windDirection: data.hourly.wind_direction_10m[index]
    });
  });

  return {
    point,
    available: dailyIndex >= 0 && hourly.length > 0,
    tempMin: valueAt(data.daily?.temperature_2m_min, dailyIndex),
    tempMax: valueAt(data.daily?.temperature_2m_max, dailyIndex),
    precipitationSum: valueAt(data.daily?.precipitation_sum, dailyIndex),
    rainSum: valueAt(data.daily?.rain_sum, dailyIndex),
    windMax: valueAt(data.daily?.wind_speed_10m_max, dailyIndex),
    gustMax: valueAt(data.daily?.wind_gusts_10m_max, dailyIndex),
    rainPeriods: rainPeriods(hourly),
    maxHourlyRain: Math.max(0, ...hourly.map((h) => h.precipitation || 0)),
    hourly
  };
}

function renderCard(card) {
  const details = document.createElement("details");
  details.className = `card ${card.available ? riskLevel(card) : ""}`;
  details.dataset.km = `${card.point.km} km`;

  if (!card.available) {
    details.innerHTML = `<summary><span class="timeline-point"><span class="place">${card.point.name}</span></span><span class="warning">Brak prognozy dla tego dnia</span></summary>`;
    return details;
  }

  details.innerHTML = `
    <summary>
      <span class="timeline-point"><span class="place">${card.point.name}</span></span>
      ${metric("Temperatura", `${fmt(card.tempMin)}–${fmt(card.tempMax)} °C`)}
      ${metric("Wiatr", windSummary(card))}
      ${metric("Opady", rainSummary(card), "rain")}
      ${alertsHtml(card)}
    </summary>
    ${card.hourly.length ? `
      <div class="hourly-wrap">
        <table class="hourly">
          <thead>
            <tr><th>Godzina</th><th>Temp.</th><th>Wiatr</th><th>Kierunek</th><th>Opad</th><th>Szansa</th></tr>
          </thead>
          <tbody>
            ${card.hourly.map(renderHour).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}
  `;
  return details;
}

function renderHour(hour) {
  const rainy = (hour.precipitation || 0) > 0;
  return `
    <tr class="${rainy ? "rain" : ""}">
      <td>${hour.time}</td>
      <td>${fmt(hour.temperature)} °C</td>
      <td>${fmt(hour.windSpeed)} km/h (${fmt(hour.windGusts)})</td>
      <td>${degToCompass(hour.windDirection)}</td>
      <td>${fmt(hour.precipitation)} mm</td>
      <td>${fmt(hour.precipitationProbability)}%</td>
    </tr>
  `;
}

function windSummary(card) {
  if (card.gustMax === null || card.gustMax === undefined) return `${fmt(card.windMax)} km/h`;
  return `${fmt(card.windMax)} km/h (${fmt(card.gustMax)})`;
}

function conditionLabel(card) {
  const level = riskLevel(card);
  if (level === "danger") return "🔴 Trudne";
  if (level === "warning") return "🟡 Uważać";
  if ((card.precipitationSum || 0) > 0) return "🌧️ Deszcz";
  if ((card.windMax || 0) >= 20) return "💨 Wietrznie";
  return "🟢 OK";
}

function riskLevel(card) {
  if ((card.maxHourlyRain || 0) >= 3 || (card.gustMax || 0) >= 55 || (card.windMax || 0) >= 40) return "danger";
  if ((card.maxHourlyRain || 0) >= 1 || (card.precipitationSum || 0) >= 3 || (card.gustMax || 0) >= 40 || (card.tempMax || 0) >= 30) return "warning";
  return "ok";
}

function alertsForCard(card) {
  const alerts = [];
  if ((card.maxHourlyRain || 0) >= 3) alerts.push({ level: "danger", text: `mocny opad do ${fmt(card.maxHourlyRain)} mm/h` });
  else if ((card.maxHourlyRain || 0) >= 1) alerts.push({ level: "warning", text: `opad do ${fmt(card.maxHourlyRain)} mm/h` });

  if ((card.gustMax || 0) >= 55) alerts.push({ level: "danger", text: `porywy ${fmt(card.gustMax)} km/h` });
  else if ((card.gustMax || 0) >= 40) alerts.push({ level: "warning", text: `porywy ${fmt(card.gustMax)} km/h` });

  if ((card.tempMax || 0) >= 30) alerts.push({ level: "warning", text: `upał ${fmt(card.tempMax)} °C` });
  return alerts;
}

function alertsHtml(card) {
  const alerts = alertsForCard(card);
  if (alerts.length === 0) return metric("Alerty", "brak", "ok");
  return `<span><span class="metric-title">Alerty</span><span class="badges">${alerts.map((alert) => `<span class="badge ${alert.level}">${alert.text}</span>`).join("")}</span></span>`;
}

function metric(title, value, className = "") {
  return `<span><span class="metric-title">${title}</span><span class="metric-value ${className}">${value}</span></span>`;
}

function rainSummary(card) {
  if ((card.precipitationSum || 0) <= 0 && card.rainPeriods.length === 0) return "brak";
  const periods = card.rainPeriods.length ? card.rainPeriods.join(", ") : "bez godzin";
  return `${fmt(card.precipitationSum)} mm, ${periods}`;
}

function rainPeriods(hourly) {
  const periods = [];
  let start = null;
  let end = null;

  hourly.forEach((hour) => {
    if ((hour.precipitation || 0) > 0) {
      start ||= hour.time;
      end = hour.time;
    } else if (start) {
      periods.push(`${start}–${addHour(end)}`);
      start = null;
      end = null;
    }
  });

  if (start) periods.push(`${start}–${addHour(end)}`);
  return periods;
}

function addHour(time) {
  const [h, m] = time.split(":").map(Number);
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function valueAt(values, index) {
  return index >= 0 ? values?.[index] : null;
}

function cacheKey(date) {
  return `wisla1200-weather-${date}`;
}

function readCachedForecast(date) {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey(date)) || "null");
    if (!cached || Date.now() - cached.savedAt > CACHE_TTL_MS) return null;
    return cached.forecasts;
  } catch (_error) {
    return null;
  }
}

function writeCachedForecast(date, value) {
  try {
    localStorage.setItem(cacheKey(date), JSON.stringify({ savedAt: Date.now(), forecasts: value }));
  } catch (_error) {
    // Cache jest tylko optymalizacją. Jeśli localStorage nie działa, ignorujemy.
  }
}

function clearWeatherCache() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith("wisla1200-weather-"))
    .forEach((key) => localStorage.removeItem(key));

  forecasts = [];
  forecastEl.innerHTML = "";
  statusEl.className = "status";
  statusEl.textContent = "Cache pogody wyczyszczony. Wybierz dzień albo odśwież dane.";
}

function fmt(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Number(value).toLocaleString("pl-PL", { maximumFractionDigits: 1 });
}

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "numeric"
  });
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysIso(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return toIsoDate(copy);
}

function minIsoDate(first, second) {
  return first <= second ? first : second;
}

function degToCompass(deg) {
  if (deg === null || deg === undefined) return "—";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(deg / 45) % 8];
}
