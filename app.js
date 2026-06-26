const YEAR = 2026;
// Do testów można ustawić np. new Date("2026-07-05T12:00:00").
// Na produkcji zostawić null.
const NOW_OVERRIDE = null; //new Date("2026-07-05T02:00:00");
const START = `${YEAR}-07-04`;
const END = `${YEAR}-07-11`;
// Open-Meteo nie pozwala pytać o dni poza zakresem prognozy.
// Zakres zwykle kończy się ok. 15 dni od dzisiaj, więc przycinamy zapytanie,
// a brakujące dni pokazujemy jako niedostępne zamiast wywalać cały request.
const TODAY = toIsoDate(now());
const API_START = maxIsoDate(START, TODAY);
const API_END = minIsoDate(END, addDaysIso(now(), 15));
const CACHE_TTL_MS = 60 * 60 * 1000;
const RIDE_SETTINGS_KEY = "wisla1200-ride-settings";
const RIDE_SETTINGS_VERSION = 2;

const routePoints = [
  { name: "Wisła", km: 0, lat: 49.6540, lon: 18.8591 },
  { name: "Skoczów", km: 43, lat: 49.801289, lon: 18.793263 },
  { name: "Wały Goczały", km: 62, lat: 49.913929, lon: 18.791301, mudRisk: true },
  { name: "Bobrowisko", km: 81, lat: 49.912525, lon: 18.890428, mudRisk: true },
  { name: "Oświęcim", km: 121, lat: 50.0344, lon: 19.2104 },
  { name: "Dół", km: 161, lat: 50.018064, lon: 19.556755 },
  { name: "Kopiec Piłsudskiego", km: 199, lat: 50.059476, lon: 19.845371, mudRisk: true },
  { name: "Kraków Rynek", km: 208, lat: 50.061453, lon: 19.935957 },
  { name: "Zwał jak zwał", km: 234, lat: 50.045930, lon: 20.180389 },
  { name: "Uście Solne", km: 268, lat: 50.118818, lon: 20.511863 },
  { name: "Opatowiec", km: 295, lat: 50.2436, lon: 20.7234 },
  { name: "Malowana Wieś", km: 332, lat: 50.229941, lon: 20.860179 },
  { name: "Szczucin", km: 357, lat: 50.314120, lon: 21.062362 },
  { name: "Przewłoka", km: 417, lat: 50.539114, lon: 21.609319 },
  { name: "Sandomierz", km: 437, lat: 50.6827, lon: 21.7489 },
  { name: "Góry Pieprzowe", km: 441, lat: 50.684609, lon: 21.785722, mudRisk: true },
  { name: "Józefów nad Wisłą", km: 490, lat: 51.039959, lon: 21.830988 },
  { name: "Kazimierz Dolny", km: 528, lat: 51.3223, lon: 21.9476 },
  { name: "Angielskie Schody", km: 545, lat: 51.413098, lon: 21.958284 },
  { name: "Dęblin", km: 566, lat: 51.5591, lon: 21.8483 },
  { name: "Bączki", km: 615, lat: 51.766246, lon: 21.451744 },
  { name: "Otwocka Amazonia", km: 670, lat: 52.115526, lon: 21.204167, mudRisk: true },
  { name: "Warszawa", km: 680, lat: 52.2297, lon: 21.0122 },
  { name: "Zakroczymska Sawanna", km: 735, lat: 52.423350, lon: 20.612402, mudRisk: true },
  { name: "Pit Stop Podgórze", km: 783, lat: 52.412870, lon: 20.012936 },
  { name: "Płock", km: 816, lat: 52.5468, lon: 19.7064 },
  { name: "Mostek p. Czesława", km: 844, lat: 52.634442, lon: 19.373602, mudRisk: true },
  { name: "Włocławek", km: 870, lat: 52.6483, lon: 19.0677 },
  { name: "Toruń", km: 925, lat: 53.0138, lon: 18.5984 },
  { name: "Toruń Wały", km: 950, lat: 53.055451, lon: 18.391703, mudRisk: true },
  { name: "Chełmno", km: 1003, lat: 53.347601, lon: 18.417243 },
  { name: "Grudziądz", km: 1030, lat: 53.4837, lon: 18.7536 },
  { name: "Nowe Dżungla", km: 1056, lat: 53.649629, lon: 18.737698, mudRisk: true },
  { name: "Małe Wiosło", km: 1066, lat: 53.735980, lon: 18.805123, mudRisk: true },
  { name: "Gniew", km: 1084, lat: 53.831987, lon: 18.822523 },
  { name: "Tczew", km: 1116, lat: 54.0924, lon: 18.7779 },
  { name: "Tczewskie Łąki", km: 1129, lat: 54.209438, lon: 18.865633, mudRisk: true },
  { name: "Ujście Wisły", km: 1153, lat: 54.358470, lon: 18.946423 },
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
const currentKmInput = document.querySelector("#currentKm");
const grossSpeedInput = document.querySelector("#grossSpeed");
const rideStartTimeInput = document.querySelector("#rideStartTime");
const defaultRideStartInput = document.querySelector("#defaultRideStart");
const defaultRideEndInput = document.querySelector("#defaultRideEnd");
const individualRideTimesInput = document.querySelector("#individualRideTimes");
const rideDaysEl = document.querySelector("#rideDays");
const calculateRideButton = document.querySelector("#calculateRide");
const clearRideSettingsButton = document.querySelector("#clearRideSettings");
const rideResultEl = document.querySelector("#rideResult");
let forecasts = [];
let rideRecalculateTimer = null;

init();

function init() {
  initTabs();
  renderShops();
  renderRideInputs();
  restoreRideSettings();
  buildDateOptions();
  dateSelect.addEventListener("change", () => loadForecastsForDay(dateSelect.value));
  refreshButton.addEventListener("click", () => {
    if (dateSelect.value) loadForecastsForDay(dateSelect.value, { forceRefresh: true });
  });
  clearCacheButton.addEventListener("click", clearWeatherCache);
  calculateRideButton.addEventListener("click", calculateRidePlan);
  clearRideSettingsButton.addEventListener("click", clearRideSettings);
  [currentKmInput, grossSpeedInput, defaultRideStartInput, defaultRideEndInput].forEach((input) => input.addEventListener("input", saveRideSettingsAndScheduleCalculation));
  rideStartTimeInput.addEventListener("input", () => {
    syncFirstRideDayStart();
    saveRideSettingsAndScheduleCalculation();
  });
  individualRideTimesInput.addEventListener("change", () => {
    rideDaysEl.classList.toggle("active", individualRideTimesInput.checked);
    saveRideSettingsAndScheduleCalculation();
  });
  rideDaysEl.addEventListener("input", saveRideSettingsAndScheduleCalculation);

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
      document.querySelector("#ridePanel").classList.toggle("active", tab === "ride");
      document.querySelector("#mapPanel").classList.toggle("active", tab === "map");
      if (tab === "ride") scheduleRideCalculation();
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

function renderRideInputs() {
  rideDaysEl.innerHTML = rideDates().map((date, index) => `
    <div class="ride-day" data-date="${date}">
      <strong>${formatDate(date)}</strong>
      <label>
        Od
        <input class="form-control ride-start" type="time" value="${index === 0 ? (rideStartTimeInput?.value || "07:20") : "04:00"}">
      </label>
      <label>
        Do
        <input class="form-control ride-end" type="time" value="22:00">
      </label>
    </div>
  `).join("");
}

function clearRideSettings() {
  if (!window.confirm("Wyczyścić ustawienia przejazdu?")) return;
  localStorage.removeItem(RIDE_SETTINGS_KEY);
  currentKmInput.value = "0";
  grossSpeedInput.value = "16";
  rideStartTimeInput.value = "07:20";
  defaultRideStartInput.value = "04:00";
  defaultRideEndInput.value = "22:00";
  individualRideTimesInput.checked = false;
  rideResultEl.innerHTML = "";
  renderRideInputs();
  rideDaysEl.classList.remove("active");
}

function syncFirstRideDayStart() {
  const firstDayStart = rideDaysEl.querySelector(`.ride-day[data-date="${START}"] .ride-start`);
  if (firstDayStart) firstDayStart.value = rideStartTimeInput.value || "07:20";
}

function saveRideSettingsAndScheduleCalculation() {
  saveRideSettings();
  scheduleRideCalculation();
}

function scheduleRideCalculation() {
  clearTimeout(rideRecalculateTimer);
  rideRecalculateTimer = setTimeout(() => {
    if (document.querySelector("#ridePanel").classList.contains("active")) calculateRidePlan();
  }, 350);
}

function saveRideSettings() {
  try {
    const days = Array.from(rideDaysEl.querySelectorAll(".ride-day")).map((day) => ({
      date: day.dataset.date,
      start: day.querySelector(".ride-start").value,
      end: day.querySelector(".ride-end").value
    }));
    localStorage.setItem(RIDE_SETTINGS_KEY, JSON.stringify({
      currentKm: currentKmInput.value,
      grossSpeed: grossSpeedInput.value,
      rideStartTime: rideStartTimeInput.value,
      defaultRideStart: defaultRideStartInput.value,
      defaultRideEnd: defaultRideEndInput.value,
      version: RIDE_SETTINGS_VERSION,
      individualRideTimes: individualRideTimesInput.checked,
      days
    }));
  } catch (_error) {
    // Zapamiętywanie ustawień jest tylko wygodą.
  }
}

function restoreRideSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(RIDE_SETTINGS_KEY) || "null");
    if (!settings) return;
    if (settings.currentKm !== undefined) currentKmInput.value = settings.currentKm;
    if (settings.grossSpeed !== undefined) grossSpeedInput.value = settings.grossSpeed;
    if (settings.rideStartTime !== undefined) rideStartTimeInput.value = settings.rideStartTime;
    if (!settings.version && settings.rideStartTime === "04:00") rideStartTimeInput.value = "07:20";
    if (settings.defaultRideStart !== undefined) defaultRideStartInput.value = settings.defaultRideStart;
    if (settings.defaultRideEnd !== undefined) defaultRideEndInput.value = settings.defaultRideEnd;
    individualRideTimesInput.checked = Boolean(settings.individualRideTimes);
    rideDaysEl.classList.toggle("active", individualRideTimesInput.checked);
    settings.days?.forEach((savedDay) => {
      const day = rideDaysEl.querySelector(`.ride-day[data-date="${savedDay.date}"]`);
      if (!day) return;
      if (savedDay.start) day.querySelector(".ride-start").value = savedDay.start;
      if (savedDay.end) day.querySelector(".ride-end").value = savedDay.end;
    });
    syncFirstRideDayStart();
  } catch (_error) {
    // Jeśli localStorage zawiera stare lub uszkodzone dane, ignorujemy.
  }
}

async function calculateRidePlan() {
  clearTimeout(rideRecalculateTimer);
  const speed = Number(grossSpeedInput.value);
  let currentKm = Number(currentKmInput.value);
  if (!Number.isFinite(speed) || speed <= 0) return;
  if (!Number.isFinite(currentKm)) currentKm = 0;

  syncFirstRideDayStart();
  const startContext = rideStartContext();
  const firstDayStart = rideDaysEl.querySelector(`.ride-day[data-date="${startContext.date}"] .ride-start`);
  if (firstDayStart) firstDayStart.value = startContext.time;

  rideResultEl.innerHTML = "Ładowanie pogody dla planu…";
  const rows = [];
  let totalHours = 0;
  let totalBreakHours = 0;
  let previousArrivalTime = null;
  let finish = null;

  for (const dayEl of rideDaysEl.querySelectorAll(".ride-day")) {
    if (currentKm >= 1200) break;

    const date = dayEl.dataset.date;
    if (date < startContext.date) continue;
    const individual = individualRideTimesInput.checked;
    const plannedStart = rows.length === 0 ? startContext.time : (individual ? dayEl.querySelector(".ride-start").value : defaultRideStartInput.value);
    const start = date === START ? maxTime(plannedStart, rideStartTimeInput.value || "07:20") : plannedStart;
    const end = individual ? dayEl.querySelector(".ride-end").value : defaultRideEndInput.value;
    if (previousArrivalTime) totalBreakHours += overnightBreakHours(previousArrivalTime, start);

    const availableHours = rideHours(start, end);
    const startKm = currentKm;
    const remainingKm = 1200 - startKm;
    const neededHours = remainingKm / speed;
    const reachesFinish = neededHours <= availableHours;
    const hours = reachesFinish ? neededHours : availableHours;
    const endKm = reachesFinish ? 1200 : startKm + hours * speed;
    const arrivalTime = reachesFinish ? addHoursToTime(start, neededHours) : end;
    const dayForecasts = await forecastsForRideDate(date);
    const checkpoints = rideCheckpoints(startKm, endKm, start, speed, date, dayForecasts);

    totalHours += hours;
    rows.push({ date, start, end, arrivalTime, hours, totalHours, startKm, endKm, checkpoints, reachesFinish });
    currentKm = endKm;
    previousArrivalTime = arrivalTime;

    if (reachesFinish) {
      finish = { date, time: arrivalTime, totalHours, totalBreakHours };
      break;
    }
  }

  const startInfo = `<div class="ride-summary"><strong>Start planu:</strong> ${formatDate(startContext.date)}, ${startContext.time}${startContext.dynamic ? " (teraz)" : ""}.</div>`;
  const lastRow = rows.at(-1);
  const summary = finish
    ? `<div class="ride-summary ok"><strong>Finish:</strong> ${formatDate(finish.date)}, ${finish.time}. Czas brutto od startu 4.07: ${formatDuration(grossElapsedHours(finish.date, finish.time))}. Sama jazda od startu: ${formatDuration(1200 / speed)}. Przerwy od startu: ${formatDuration(breakHoursFromStart(finish.date, finish.time))}.</div>`
    : `<div class="ride-summary warning"><strong>Nie dojeżdżasz do mety</strong> w podanych dniach. Czas brutto od startu 4.07: ${lastRow ? formatDuration(grossElapsedHours(lastRow.date, lastRow.arrivalTime)) : "—"}. Sama jazda od startu: ${lastRow ? formatDuration(lastRow.endKm / speed) : "—"}. Przerwy od startu: ${lastRow ? formatDuration(breakHoursFromStart(lastRow.date, lastRow.arrivalTime)) : "—"}.</div>`;
  rideResultEl.innerHTML = startInfo + summary + rows.map(renderRideRow).join("");
}

function grossElapsedHours(date, time) {
  const start = new Date(`${START}T${rideStartTimeInput.value || "07:20"}:00`);
  const finish = new Date(`${date}T${time}:00`);
  return Math.max(0, (finish - start) / 36e5);
}

function breakHoursFromStart(finishDate, finishTime) {
  const days = Array.from(rideDaysEl.querySelectorAll(".ride-day"));
  const individual = individualRideTimesInput.checked;
  let breaks = 0;

  for (let index = 0; index < days.length - 1; index += 1) {
    const day = days[index];
    const nextDay = days[index + 1];
    const date = day.dataset.date;
    const nextDate = nextDay.dataset.date;
    if (date >= finishDate) break;

    const dayEnd = individual ? day.querySelector(".ride-end").value : defaultRideEndInput.value;
    const nextStart = nextDate === START
      ? (rideStartTimeInput.value || "04:00")
      : (individual ? nextDay.querySelector(".ride-start").value : defaultRideStartInput.value);

    if (nextDate > finishDate || (nextDate === finishDate && timeToMinutes(nextStart) > timeToMinutes(finishTime))) {
      breaks += Math.max(0, (new Date(`${finishDate}T${finishTime}:00`) - new Date(`${date}T${dayEnd}:00`)) / 36e5);
      break;
    }

    breaks += Math.max(0, (new Date(`${nextDate}T${nextStart}:00`) - new Date(`${date}T${dayEnd}:00`)) / 36e5);
  }

  return breaks;
}

function rideStartContext() {
  const current = now();
  const today = toIsoDate(current);
  if (today >= START && today <= END) {
    const currentMinutes = current.getHours() * 60 + current.getMinutes();
    const todayStart = rideWindowStart(today);
    const todayEnd = rideWindowEnd(today);
    const startMinutes = timeToMinutes(todayStart);
    const endMinutes = timeToMinutes(todayEnd);

    if (currentMinutes < startMinutes) return { date: today, time: todayStart, dynamic: true };
    if (currentMinutes <= endMinutes) return { date: today, time: minutesToTime(currentMinutes), dynamic: true };

    const nextDate = nextRideDate(today);
    if (nextDate) return { date: nextDate, time: rideWindowStart(nextDate), dynamic: true };
    return { date: today, time: todayEnd, dynamic: true };
  }
  return { date: START, time: rideStartTimeInput.value || "07:20", dynamic: false };
}

function rideWindowStart(date) {
  if (date === START) return rideStartTimeInput.value || "07:20";
  if (!individualRideTimesInput.checked) return defaultRideStartInput.value || "04:00";
  return rideDaysEl.querySelector(`.ride-day[data-date="${date}"] .ride-start`)?.value || "04:00";
}

function rideWindowEnd(date) {
  if (!individualRideTimesInput.checked) return defaultRideEndInput.value || "22:00";
  return rideDaysEl.querySelector(`.ride-day[data-date="${date}"] .ride-end`)?.value || "22:00";
}

function nextRideDate(date) {
  return rideDates().find((rideDate) => rideDate > date) || null;
}

function renderRideRow(row) {
  return `
    <article class="ride-row ride-day-row">
      <div class="ride-row-main">
        <strong>${formatDate(row.date)}</strong>
        <span>${row.start}–${row.arrivalTime}, ${formatDuration(row.hours)}</span>
      </div>
      <div><span class="metric-title">Start</span><strong>${fmt(row.startKm)} km</strong></div>
      <div><span class="metric-title">Koniec</span><strong>${fmt(row.endKm)} km</strong>${row.reachesFinish ? `<span class="ok d-block">meta ${row.arrivalTime}</span>` : ""}</div>
      <div class="ride-checkpoints">
        <div class="ride-checkpoint ride-checkpoint-start">
          <div><strong>${row.start}</strong><span>start dnia</span></div>
          <div><strong>${fmt(row.startKm)} km</strong><span>ruszasz</span></div>
          <div></div>
        </div>
        ${row.checkpoints.length ? row.checkpoints.map(renderRideCheckpoint).join("") : `<span class="warning">Brak punktów trasy w tym odcinku.</span>`}
        <div class="ride-checkpoint ride-checkpoint-end">
          <div><strong>${row.arrivalTime}</strong><span>${row.reachesFinish ? "meta" : "koniec dnia"}</span></div>
          <div><strong>${fmt(row.endKm)} km</strong><span>${row.reachesFinish ? "Gdańsk / meta" : "postój"}</span></div>
          <div></div>
        </div>
      </div>
    </article>
  `;
}

function renderRideCheckpoint(checkpoint) {
  const weather = checkpoint.weather;
  const mud = mudAlert(checkpoint.point, weather);
  const weatherHtml = weather ? `
    <span>${fmt(weather.temperature)}°C</span>
    <span>wiatr ${fmt(weather.windSpeed)} km/h (${fmt(weather.windGusts)}) · ${weather.relativeWind}</span>
    <span class="rain ${rainStatus({ maxHourlyRain: weather.precipitation, precipitationSum: weather.precipitation, rainPeriods: [] }).level}">${rainHourLabel(weather.precipitation)}</span>
    ${mud ? `<span class="mud-alert ${mud.level}">${mud.text}</span>` : ""}
  ` : `<span class="warning">pogoda niedostępna</span>`;

  return `
    <div class="ride-checkpoint">
      <div><strong>${checkpoint.time}</strong><span>${checkpoint.point.km} km</span></div>
      <div><strong>${checkpoint.point.name}</strong><span>pogoda ±1 h</span></div>
      <div class="ride-weather">${weatherHtml}</div>
    </div>
  `;
}

async function forecastsForRideDate(date) {
  if (date < API_START || date > API_END) return null;
  const cached = readCachedForecast(date) || await loadRouteForecast(date);
  writeCachedForecast(date, cached);
  return cached;
}

function rideCheckpoints(startKm, endKm, startTime, speed, date, dayForecasts) {
  return routePoints
    .filter((point) => point.km > startKm && point.km <= endKm)
    .map((point) => {
      const time = addHoursToTime(startTime, (point.km - startKm) / speed);
      const forecast = dayForecasts?.find((item) => item.point.name === point.name);
      return { point, time, weather: forecast ? weatherAroundTime(forecast.data, date, time, point) : null };
    });
}

function weatherAroundTime(data, date, time, point) {
  const target = timeToMinutes(time);
  const hours = [];
  data.hourly?.time?.forEach((hourTime, index) => {
    if (hourTime.slice(0, 10) !== date) return;
    const minutes = timeToMinutes(hourTime.slice(11, 16));
    if (Math.abs(minutes - target) > 180) return;
    hours.push({
      minutes,
      temperature: data.hourly.temperature_2m[index],
      precipitation: data.hourly.precipitation[index],
      windSpeed: data.hourly.wind_speed_10m[index],
      windGusts: data.hourly.wind_gusts_10m[index],
      windDirection: data.hourly.wind_direction_10m[index]
    });
  });
  if (!hours.length) return null;
  return {
    temperature: average(hours.filter((hour) => Math.abs(hour.minutes - target) <= 60).map((hour) => hour.temperature)),
    precipitation: Math.max(0, ...hours.filter((hour) => Math.abs(hour.minutes - target) <= 60).map((hour) => hour.precipitation || 0)),
    mudWindowPrecipitation: Math.max(0, ...hours.map((hour) => hour.precipitation || 0)),
    dailyPrecipitation: significantPrecipitationSum(dayHours(data, date)),
    windSpeed: Math.max(0, ...hours.filter((hour) => Math.abs(hour.minutes - target) <= 60).map((hour) => hour.windSpeed || 0)),
    windGusts: Math.max(0, ...hours.filter((hour) => Math.abs(hour.minutes - target) <= 60).map((hour) => hour.windGusts || 0)),
    relativeWind: relativeWind(average(hours.filter((hour) => Math.abs(hour.minutes - target) <= 60).map((hour) => hour.windDirection)), travelDirection(point))
  };
}

function dayHours(data, date) {
  const hours = [];
  data.hourly?.time?.forEach((time, index) => {
    if (time.slice(0, 10) !== date) return;
    hours.push({ precipitation: data.hourly.precipitation[index] });
  });
  return hours;
}

function mudAlert(point, weather) {
  if (!point.mudRisk || !weather) return null;
  const windowRain = weather.mudWindowPrecipitation || 0;
  const dayRain = weather.dailyPrecipitation || 0;

  if (windowRain >= 3.1 || dayRain >= 10) return { level: "danger", text: "🟤 bardzo błotnie" };
  if (windowRain >= 1.6 || dayRain >= 5) return { level: "warning", text: "🟤 błoto prawdopodobne" };
  if (windowRain >= 0.6 || dayRain >= 2) return { level: "possible", text: "🟤 możliwe błoto" };
  return { level: "info", text: "odcinek błotny, sucho" };
}

function average(values) {
  const numbers = values.filter((value) => Number.isFinite(Number(value))).map(Number);
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null;
}

function rideHours(start, end) {
  const startTotal = timeToMinutes(start);
  let endTotal = timeToMinutes(end);
  if (endTotal < startTotal) endTotal += 24 * 60;
  return Math.max(0, (endTotal - startTotal) / 60);
}

function addHoursToTime(time, hours) {
  const total = Math.round(timeToMinutes(time) + hours * 60) % (24 * 60);
  return minutesToTime(total);
}

function overnightBreakHours(previousEnd, nextStart) {
  return (24 * 60 - timeToMinutes(previousEnd) + timeToMinutes(nextStart)) / 60;
}

function maxTime(first, second) {
  return timeToMinutes(first) >= timeToMinutes(second) ? first : second;
}

function timeToMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(total) {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDuration(hours) {
  const minutes = Math.round(hours * 60);
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function rideDates() {
  const dates = [];
  const start = new Date(`${START}T00:00:00`);
  for (let i = 0; i < 8; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(toIsoDate(date));
  }
  return dates;
}

function defaultSelectedDate() {
  return TODAY >= START && TODAY <= END ? TODAY : START;
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

  if (date < API_START || date > API_END) {
    forecasts = [];
    statusEl.className = "status warning";
    statusEl.textContent = date < API_START ? "Nie pobieram pogody dla dni starszych niż dzisiaj." : "Prognoza dla tego dnia nie jest jeszcze dostępna w API.";
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
    statusEl.textContent = `Dane z Open-Meteo dla ${formatDate(date)}. Ostatnie odświeżenie: ${now().toLocaleString("pl-PL")}.`;
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
      windDirection: data.hourly.wind_direction_10m[index],
      travelDirection: travelDirection(point)
    });
  });

  return {
    point,
    available: dailyIndex >= 0 && hourly.length > 0,
    tempMin: valueAt(data.daily?.temperature_2m_min, dailyIndex),
    tempMax: valueAt(data.daily?.temperature_2m_max, dailyIndex),
    precipitationSum: significantPrecipitationSum(hourly),
    rainSum: valueAt(data.daily?.rain_sum, dailyIndex),
    windMax: valueAt(data.daily?.wind_speed_10m_max, dailyIndex),
    gustMax: valueAt(data.daily?.wind_gusts_10m_max, dailyIndex),
    travelDirection: travelDirection(point),
    relativeWind: relativeWindForDay(hourly),
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
      ${metric("Wiatr vs jazda", card.relativeWind)}
      ${metric("Opady", rainSummary(card), `rain ${rainStatus(card).level}`)}
      ${alertsHtml(card)}
    </summary>
    ${card.hourly.length ? `
      <div class="hourly-wrap">
        <table class="hourly">
          <thead>
            <tr><th>Godzina</th><th>Temp.</th><th>Wiatr</th><th>Wiatr</th><th>Jazda</th><th>Opad</th><th>Szansa</th></tr>
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
      <td>${degToCompass(hour.windDirection)} · ${relativeWind(hour.windDirection, hour.travelDirection)}</td>
      <td>${degToCompass(hour.travelDirection)}</td>
      <td>${fmt(hour.precipitation)} mm</td>
      <td>${fmt(hour.precipitationProbability)}%</td>
    </tr>
  `;
}

function windSummary(card) {
  if (card.gustMax === null || card.gustMax === undefined) return `${fmt(card.windMax)} km/h`;
  return `${fmt(card.windMax)} km/h (${fmt(card.gustMax)})`;
}

function travelDirection(point) {
  const index = routePoints.findIndex((routePoint) => routePoint.name === point.name);
  const next = routePoints[index + 1] || routePoints[index];
  const previous = routePoints[index - 1] || routePoints[index];
  return bearing(previous, next);
}

function bearing(from, to) {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLon = toRad(to.lon - from.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function relativeWindForDay(hourly) {
  const strongest = hourly.reduce((best, hour) => (hour.windSpeed || 0) > (best?.windSpeed || 0) ? hour : best, null);
  return strongest ? relativeWind(strongest.windDirection, strongest.travelDirection) : "—";
}

function relativeWind(windFrom, travelBearing) {
  if (windFrom === null || windFrom === undefined || travelBearing === null || travelBearing === undefined) return "—";
  const windTo = (Number(windFrom) + 180) % 360;
  const diff = angleDiff(windTo, travelBearing);
  if (diff <= 45) return "w plecy";
  if (diff >= 135) return "w ryj";
  return "boczny";
}

function angleDiff(first, second) {
  const diff = Math.abs(((first - second + 540) % 360) - 180);
  return diff;
}

function toRad(deg) {
  return deg * Math.PI / 180;
}

function toDeg(rad) {
  return rad * 180 / Math.PI;
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
  if ((card.maxHourlyRain || 0) > 5) alerts.push({ level: "danger", text: `ulewa do ${fmt(card.maxHourlyRain)} mm/h` });
  else if ((card.maxHourlyRain || 0) > 3) alerts.push({ level: "danger", text: `mocny deszcz do ${fmt(card.maxHourlyRain)} mm/h` });
  else if ((card.maxHourlyRain || 0) > 1.5) alerts.push({ level: "warning", text: `deszcz do ${fmt(card.maxHourlyRain)} mm/h` });
  else if ((card.maxHourlyRain || 0) >= 0.6) alerts.push({ level: "warning", text: `lekki deszcz do ${fmt(card.maxHourlyRain)} mm/h` });

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
  const status = rainStatus(card);
  if (status.level === "dry") return "brak / śladowy";
  const periods = card.rainPeriods.length ? card.rainPeriods.join(", ") : "bez godzin";
  return `${status.label}: ${fmt(card.precipitationSum)} mm, max ${fmt(card.maxHourlyRain)} mm/h, ${periods}`;
}

function rainHourLabel(mm) {
  const status = rainStatus({ maxHourlyRain: mm || 0 });
  if (status.level === "dry") return "brak / śladowy";
  return `${status.label}, max ${fmt(mm)} mm/h`;
}

function rainStatus(card) {
  const max = card.maxHourlyRain || 0;
  if (max <= 0.1) return { level: "dry", label: "brak" };
  if (max <= 0.5) return { level: "drizzle", label: "mżawka" };
  if (max <= 1.5) return { level: "light-rain", label: "lekki deszcz" };
  if (max <= 3) return { level: "rain", label: "deszcz" };
  if (max <= 5) return { level: "heavy-rain", label: "mocny deszcz" };
  return { level: "downpour", label: "ulewa" };
}

function significantPrecipitationSum(hourly) {
  return hourly.reduce((sum, hour) => sum + ((hour.precipitation || 0) >= 0.2 ? hour.precipitation : 0), 0);
}

function rainPeriods(hourly) {
  const periods = [];
  let start = null;
  let end = null;

  hourly.forEach((hour) => {
    if ((hour.precipitation || 0) >= 0.2) {
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

function now() {
  return NOW_OVERRIDE || new Date();
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

function maxIsoDate(first, second) {
  return first >= second ? first : second;
}

function degToCompass(deg) {
  if (deg === null || deg === undefined) return "—";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(deg / 45) % 8];
}
