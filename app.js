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
  { name: "Start", km: 0, lat: 49.596179, lon: 18.983949 },
  { name: "Wisła", km: 13, lat: 49.6540, lon: 18.8591 },
  { name: "Skoczów", km: 35, lat: 49.801289, lon: 18.793263 },
  { name: "Wały Goczały", km: 54, lat: 49.913929, lon: 18.791301, mudRisk: true },
  { name: "Bobrowisko", km: 66, lat: 49.912525, lon: 18.890428, mudRisk: true },
  { name: "Oświęcim", km: 107, lat: 50.0344, lon: 19.2104 },
  { name: "Dół", km: 148, lat: 50.018064, lon: 19.556755 },
  { name: "Kopiec Piłsudskiego", km: 186, lat: 50.059476, lon: 19.845371, mudRisk: true },
  { name: "Kraków Rynek", km: 194, lat: 50.061453, lon: 19.935957 },
  { name: "Zwał jak zwał", km: 220, lat: 50.045930, lon: 20.180389 },
  { name: "Uście Solne", km: 253, lat: 50.118818, lon: 20.511863 },
  { name: "Opatowiec", km: 282, lat: 50.2436, lon: 20.7234 },
  { name: "Malowana Wieś", km: 318, lat: 50.229941, lon: 20.860179 },
  { name: "Szczucin", km: 344, lat: 50.314120, lon: 21.062362 },
  { name: "Podwale", km: 383, lat: 50.457420, lon: 21.435123 },
  { name: "Sandomierz", km: 424, lat: 50.6827, lon: 21.7489 },
  { name: "Góry Pieprzowe", km: 427, lat: 50.684609, lon: 21.785722, mudRisk: true },
  { name: "Józefów nad Wisłą", km: 476, lat: 51.039959, lon: 21.830988 },
  { name: "Kazimierz Dolny", km: 514, lat: 51.3223, lon: 21.9476 },
  { name: "Angielskie Schody", km: 531, lat: 51.413098, lon: 21.958284 },
  { name: "Dęblin", km: 552, lat: 51.5591, lon: 21.8483 },
  { name: "Bączki", km: 602, lat: 51.766246, lon: 21.451744 },
  { name: "Otwocka Amazonia", km: 655, lat: 52.115526, lon: 21.204167, mudRisk: true },
  { name: "Warszawa", km: 674, lat: 52.2297, lon: 21.0122 },
  { name: "Zakroczymska Sawanna", km: 720, lat: 52.423350, lon: 20.612402, mudRisk: true },
  { name: "Pit Stop Podgórze", km: 769, lat: 52.412870, lon: 20.012936 },
  { name: "Płock", km: 803, lat: 52.5468, lon: 19.7064 },
  { name: "Mostek p. Czesława", km: 829, lat: 52.634442, lon: 19.373602, mudRisk: true },
  { name: "Włocławek", km: 856, lat: 52.6483, lon: 19.0677 },
  { name: "Toruń", km: 915, lat: 53.0138, lon: 18.5984 },
  { name: "Toruń Wały", km: 935, lat: 53.055451, lon: 18.391703, mudRisk: true },
  { name: "Chełmno", km: 988, lat: 53.347601, lon: 18.417243 },
  { name: "Grudziądz", km: 1021, lat: 53.4837, lon: 18.7536 },
  { name: "Góry Łosiowe", km: 1030, lat: 53.555208, lon: 18.769240, mudRisk: true },
  { name: "Gniew", km: 1073, lat: 53.831987, lon: 18.822523 },
  { name: "Tczew", km: 1106, lat: 54.0924, lon: 18.7779 },
  { name: "Tczewskie Łąki", km: 1113, lat: 54.209438, lon: 18.865633, mudRisk: true },
  { name: "Ujście Wisły", km: 1142, lat: 54.358470, lon: 18.946423 },
  { name: "Gdańsk", km: 1170, lat: 54.3520, lon: 18.6466 }
];

const pois = [
  {
    "km": 15.2,
    "town": "Wisła",
    "type": "SKLEP",
    "description": "Żabka (trzeba odbić w lewo ze ścieżki do głównej drogi)"
  },
  {
    "km": 16.7,
    "town": "Wisła",
    "type": "SKLEP",
    "description": "Lidl (odbić w ul. Jawornik)"
  },
  {
    "km": 20.3,
    "town": "Ustroń",
    "type": "STACJA",
    "description": "Orlen  (po prawej przy głównej)"
  },
  {
    "km": 30.0,
    "town": "Harbutowice",
    "type": "UJEB",
    "description": "Krzoki"
  },
  {
    "km": 36.0,
    "town": "Skoczów",
    "type": "STACJA",
    "description": "Orlen (trzeba przejechać przez most do głównej)"
  },
  {
    "km": 45.3,
    "town": "Drogomyśl",
    "type": "SKLEP",
    "description": "EMI (6-20)"
  },
  {
    "km": 52.5,
    "town": "",
    "type": "SKLEP",
    "description": "Żabka"
  },
  {
    "km": 54.2,
    "town": "Zabłocie",
    "type": "UJEB",
    "description": "Wały goczałkowickie"
  },
  {
    "km": 66.5,
    "town": "",
    "type": "UJEB",
    "description": "Bobrowisko"
  },
  {
    "km": 72.4,
    "town": "",
    "type": "PIT STOP",
    "description": "za zaporą"
  },
  {
    "km": 79.0,
    "town": "Czechowice",
    "type": "STACJA",
    "description": "SHELL/BURGER KING - trzeba dojechać do głównej"
  },
  {
    "km": 94.4,
    "town": "Góra",
    "type": "POI",
    "description": "ŻABKA"
  },
  {
    "km": 117.2,
    "town": "",
    "type": "POI",
    "description": "WTR Asfalt"
  },
  {
    "km": 120.2,
    "town": "Bobrek",
    "type": "SKLEP",
    "description": "ŻABKA (trzeba zjechać z wału w lewo"
  },
  {
    "km": 143.0,
    "town": "Okleśna",
    "type": "POI",
    "description": "Ruiny Strażnicy CK z 1905r"
  },
  {
    "km": 148.0,
    "town": "Lipowa",
    "type": "UJEB",
    "description": "Wypych pod górkę za stawami"
  },
  {
    "km": 154.5,
    "town": "Chrząstowice",
    "type": "POI",
    "description": "Sklep  (6-19)"
  },
  {
    "km": 178.5,
    "town": "Klasztor w Tyńcu",
    "type": "POI",
    "description": "tu Snack Bary"
  },
  {
    "km": 183.0,
    "town": "Kraków",
    "type": "SKLEP",
    "description": "Jubilat (w połowie podjazdu przy skrzyżowaniu)"
  },
  {
    "km": 186.3,
    "town": "Kraków",
    "type": "POI",
    "description": "Kopiec Piłsudskiego"
  },
  {
    "km": 189.0,
    "town": "",
    "type": "UJEB",
    "description": "Stromy Podjazd"
  },
  {
    "km": 191.0,
    "town": "Kraków",
    "type": "POI",
    "description": "Kopiec Kościuszki"
  },
  {
    "km": 198.0,
    "town": "Kraków",
    "type": "STACJA",
    "description": "ORLEN - trzeba zjechać z wału"
  },
  {
    "km": 207.3,
    "town": "Kraków",
    "type": "NOCLEG",
    "description": "Willa Julia - Niepokalanej Panny Marii 76A, 31-589 Kraków, Polska +48535422088"
  },
  {
    "km": 208.6,
    "town": "Kraków",
    "type": "NOCLEG",
    "description": "Hostel Ciepły Kąt - Feliksa Wrobela 143B, 30-798 Kraków, Polska 696100068"
  },
  {
    "km": 209.7,
    "town": "Kraków",
    "type": "NOCLEG",
    "description": "Max Bruk - Bugaj 28, 30-799 Kraków, Polska, 575720650"
  },
  {
    "km": 213.0,
    "town": "Brzegi",
    "type": "SKLEP",
    "description": "GROSZEK (sb 6-21, nd 10-17)"
  },
  {
    "km": 214.4,
    "town": "Brzegi",
    "type": "SKLEP",
    "description": "KONGRES (sb 6-17, nd 10-14)"
  },
  {
    "km": 217.5,
    "town": "Niepołomice",
    "type": "RESTAURACJA",
    "description": "Nadwiślanka Jazz (sb 10.30-20.00, nd 10.30-19.00)"
  },
  {
    "km": 219.2,
    "town": "Niepołomice",
    "type": "SKLEP",
    "description": "DINO"
  },
  {
    "km": 220.7,
    "town": "Niepołomice",
    "type": "PIT STOP",
    "description": "Zwał Jak Zwał"
  },
  {
    "km": 224.0,
    "town": "Niepołomice",
    "type": "POI",
    "description": "stacja ORLEN"
  },
  {
    "km": 224.0,
    "town": "Niepołomice",
    "type": "POI",
    "description": "MCDONALDS (6-24)"
  },
  {
    "km": 224.0,
    "town": "Niepołomice",
    "type": "NOCLEG",
    "description": "Pensjonat Alicja - Grabska 12L, 32-005 Niepołomice, Polska - 508103958"
  },
  {
    "km": 224.0,
    "town": "Niepołomice",
    "type": "NOCLEG",
    "description": "Noclegi Niepołomice - Kasztanowa 11, 32-005 Niepołomice, Polska - 665031101"
  },
  {
    "km": 224.0,
    "town": "Niepołomice",
    "type": "NOCLEG",
    "description": "Hotel Novum - Grunwaldzka 15H, 32-005 Niepołomice, Polska - 122798900"
  },
  {
    "km": 224.0,
    "town": "Niepołomice",
    "type": "NOCLEG",
    "description": "Pokoje Gościnne - ul.Rotm, Rotmistrza Witolda Pileckiego 18, 32-005 Niepołomice, Polska - 605877190"
  },
  {
    "km": 224.0,
    "town": "Niepołomice",
    "type": "NOCLEG",
    "description": "Pokoje do wynajęcia - Portowa 17A, 32-005 Niepołomice, Polska"
  },
  {
    "km": 224.0,
    "town": "Niepołomice",
    "type": "NOCLEG",
    "description": "Centrum KÓŁKO - Wiśniowa 22, 32-005 Niepołomice, Polska - 531700387"
  },
  {
    "km": 241.0,
    "town": "Nowe Brzesko",
    "type": "POI",
    "description": "Stacja ORLEN  (trzeba przejechać na drugą stronę Wisły i skręcić w prawo)"
  },
  {
    "km": 241.0,
    "town": "Nowe Brzesko",
    "type": "SKLEP",
    "description": "ŻABKA"
  },
  {
    "km": 245.5,
    "town": "Grobla",
    "type": "BISTRO",
    "description": "Apacz (nd. 14-22)"
  },
  {
    "km": 254.5,
    "town": "Uście Solne",
    "type": "PIEKARNIA",
    "description": "(nd 10-20)"
  },
  {
    "km": 259.0,
    "town": "Popędzyna",
    "type": "POI",
    "description": "Dwór Sobolewskich - Ruina"
  },
  {
    "km": 271.0,
    "town": "Kopacze Wielkie",
    "type": "SKLEP",
    "description": "(nd. 10-16?)"
  },
  {
    "km": 288.0,
    "town": "Wietrzychowice",
    "type": "STACJA",
    "description": "Tank System (nd 9-16)"
  },
  {
    "km": 304.5,
    "town": "Żabno",
    "type": "SKLEP",
    "description": "Żabka (nd 9-21)"
  },
  {
    "km": 309.3,
    "town": "Nieciecza",
    "type": "BISTO",
    "description": "Klub Kibica (10-16)"
  },
  {
    "km": 318.5,
    "town": "Zalipie",
    "type": "POI",
    "description": "Malowana Wieś"
  },
  {
    "km": 318.5,
    "town": "Zalipie",
    "type": "BISTRO",
    "description": "u Zosi (nd 11-18.30)"
  },
  {
    "km": 336.0,
    "town": "Kupienin",
    "type": "SKLEP",
    "description": "Malinka (nd 11-16)"
  },
  {
    "km": 344.0,
    "town": "Szczucin",
    "type": "SKLEP",
    "description": "Biedronka (nd 8-22)"
  },
  {
    "km": 344.0,
    "town": "Szczucin",
    "type": "SKLEP",
    "description": "Żabka (nd 6-22)"
  },
  {
    "km": 347.5,
    "town": "Rataje Słupskie",
    "type": "STACJA",
    "description": "ORLEN (24h)"
  },
  {
    "km": 361.4,
    "town": "Łubnice",
    "type": "SKLEP",
    "description": "Market Express (nd 11-21)"
  },
  {
    "km": 370.0,
    "town": "Połaniec",
    "type": "RESTAURACJA",
    "description": "Syta Chata (nd 11-17)"
  },
  {
    "km": 370.0,
    "town": "Połaniec",
    "type": "SKLEP",
    "description": "Żabka (nd 10-20)"
  },
  {
    "km": 370.0,
    "town": "Połaniec",
    "type": "NOCLEG",
    "description": "Legionów 1, 28-230 Połaniec, Polska - 607535224"
  },
  {
    "km": 370.0,
    "town": "Połaniec",
    "type": "NOCLEG",
    "description": "Mielecka 43, 28-230 Połaniec, Polska - 158650113"
  },
  {
    "km": 402.3,
    "town": "Chodków Stary",
    "type": "SKLEP U HELENKI",
    "description": "(nd 8.30-13 15-20)"
  },
  {
    "km": 411.2,
    "town": "Kamieniec",
    "type": "POI",
    "description": "Figura M.Boskiej przez UFO wziętej"
  },
  {
    "km": 420.0,
    "town": "Koćmierzów",
    "type": "NOCLEG",
    "description": "Koćmierzów 2, 27-650 Koćmierzów, Polska - 607560016"
  },
  {
    "km": 420.0,
    "town": "Zawisełcze",
    "type": "NOCLEG",
    "description": "Zawisełcze 2, 27-650 Zawisełcze, Polska - 607560016"
  },
  {
    "km": 420.0,
    "town": "Sandomierz",
    "type": "NOCLEG",
    "description": "Willa Krzemień - Krakowska 5B, 27-600 Sandomierz, Polska - 505107366"
  },
  {
    "km": 420.0,
    "town": "Sandomierz",
    "type": "NOCLEG",
    "description": "Salve Regina - Salve Regina 33, 27-600 Sandomierz, Polska - 662279289"
  },
  {
    "km": 420.0,
    "town": "Sandomierz",
    "type": "NOCLEG",
    "description": "Hotel Mały Rzym - Stefana Okrzei 9, 27-600 Sandomierz, Polska - 535449090"
  },
  {
    "km": 420.0,
    "town": "Sandomierz",
    "type": "NOCLEG",
    "description": "LAwendowe domki - Reformacka 6, 27-600 Sandomierz, Polska - 661888915"
  },
  {
    "km": 420.0,
    "town": "Sandomierz",
    "type": "NOCLEG",
    "description": "Kołodziejówka - Zawichojska 6, 27-600 Sandomierz, Polska -"
  },
  {
    "km": 420.0,
    "town": "Sandomierz",
    "type": "NOCLEG",
    "description": "Apart Hotel - Rynek 16-17, 27-600 Sandomierz, Polska - 790569086"
  },
  {
    "km": 422.0,
    "town": "SANDOMIERZ",
    "type": "POI",
    "description": "Rynek"
  },
  {
    "km": 424.5,
    "town": "Sandomierz",
    "type": "POI",
    "description": "ORLEN"
  },
  {
    "km": 427.5,
    "town": "",
    "type": "UJEB",
    "description": "Góry Pieprzowe"
  },
  {
    "km": 445.0,
    "town": "Zawichost",
    "type": "SKLEP",
    "description": "ŻABKA (6-23)"
  },
  {
    "km": 445.5,
    "town": "Zawichost",
    "type": "POI",
    "description": "Zabytkowy Wodowskaz"
  },
  {
    "km": 457.5,
    "town": "Annopol",
    "type": "POI",
    "description": "BISTRO (9-19)"
  },
  {
    "km": 475.8,
    "town": "Józefów nW",
    "type": "STACJA",
    "description": "ORLEN (6-22)"
  },
  {
    "km": 476.5,
    "town": "Józefów Nw",
    "type": "NOCLEG",
    "description": "Hotel - Nadwiślańska 19, 24-340 Józefów nad Wisłą, Polska 502710925"
  },
  {
    "km": 484.0,
    "town": "Piotrawin",
    "type": "NOCLEG",
    "description": "Domki Letniskowe - 506056063"
  },
  {
    "km": 484.0,
    "town": "Hotel Pałac",
    "type": "NOCLEG",
    "description": "Piotrawin 95, 24-335 Piotrawin, Polska - 600004608"
  },
  {
    "km": 495.2,
    "town": "Zakrzów",
    "type": "SKLEP",
    "description": "DINO (6-22.30), zjechać z trasy w prawo"
  },
  {
    "km": 500.5,
    "town": "Kępa Chotecka Sklep",
    "type": "POI",
    "description": "ODIDO (5.30-22)"
  },
  {
    "km": 504.6,
    "town": "Wilków",
    "type": "SKLEP",
    "description": "EURO (6-20)"
  },
  {
    "km": 511.7,
    "town": "",
    "type": "POI",
    "description": "Wiatrak i punkt widokowy"
  },
  {
    "km": 513.8,
    "town": "Kazimierz",
    "type": "NOCLEG",
    "description": "Hotel Spichlerz - Krakowska 61, 24-120 Kazimierz Dolny, Polska - 606901157"
  },
  {
    "km": 515.0,
    "town": "Kazimierz",
    "type": "NOCLEG",
    "description": "Villa Bohema - Juliusza Małachowskiego 12, 24-120 Kazimierz Dolny, Polska - 818810756"
  },
  {
    "km": 520.0,
    "town": "Bochotnica",
    "type": "NOCLEG",
    "description": "Stanisław Rodzik - Nałęczowska 26, 24-120 Bochotnica, Polska - 602433134"
  },
  {
    "km": 526.0,
    "town": "Puławy",
    "type": "BISTRO",
    "description": "Lodolandia"
  },
  {
    "km": 534.0,
    "town": "Puławy",
    "type": "POI",
    "description": "Restauracja McDonalds"
  },
  {
    "km": 550.0,
    "town": "Borowa",
    "type": "SKLEP",
    "description": "GROSZEK (6-21)"
  },
  {
    "km": 553.0,
    "town": "Dęblin",
    "type": "SKLEP",
    "description": "Lidl, Kaufland, Żabka"
  },
  {
    "km": 554.0,
    "town": "Dęblin",
    "type": "NOCLEGI",
    "description": "Bonsai - 1 Maja 40, 08-530 Dęblin, Polska - 533120100"
  },
  {
    "km": 554.0,
    "town": "Dęblin",
    "type": "NOCLEGI",
    "description": "Zajazd na Towarowej - Towarowa 5, 08-530 Dęblin, Polska - 502391380"
  },
  {
    "km": 555.0,
    "town": "Dęblin",
    "type": "NOCLEGI",
    "description": "Pokoje - Stefana Okrzei 9a, 08-530 Dęblin, Polska - 660528308"
  },
  {
    "km": 564.2,
    "town": "Prażmów",
    "type": "NOCLEGI",
    "description": "Agroturystyka Nad Brzegiem Wisły - Prażmów 36, 08-540 Stężyca, Polska - 575920301"
  },
  {
    "km": 604.0,
    "town": "",
    "type": "POI",
    "description": "PITSTOP KURKOWO ?"
  },
  {
    "km": 616.0,
    "town": "Stare Podole",
    "type": "SKLEP",
    "description": "Spożywczy (6-20)"
  },
  {
    "km": 633.7,
    "town": "Radwanków Szlachecki",
    "type": "RESTAURACJA",
    "description": "Podhulanka (11-19)"
  },
  {
    "km": 638.0,
    "town": "Ostrówek",
    "type": "SKLEP",
    "description": "(6-20.30)"
  },
  {
    "km": 647.4,
    "town": "Nadbrzeż",
    "type": "POI",
    "description": "SKLEP Odido (6-19)"
  },
  {
    "km": 653.0,
    "town": "Otwock/Józefów",
    "type": "NOCLEG",
    "description": "Holliday Inn - Telimeny 1, 05-420 Józefów, Polska - 227783000"
  },
  {
    "km": 653.0,
    "town": "Otwock",
    "type": "NOCLEG",
    "description": "Z-Hotel - Wczasowa 25, 05-400 Otwock, Polska - 227781130"
  },
  {
    "km": 655.0,
    "town": "",
    "type": "UJEB",
    "description": "Amazonia Otwocka"
  },
  {
    "km": 671.0,
    "town": "Warszawa",
    "type": "NOCLEG",
    "description": "Hotel B&B East - Kosmatki 8, 03-982 Warszawa, Polska - 223785444"
  },
  {
    "km": 688.0,
    "town": "Warszawa",
    "type": "POI",
    "description": "SKLEP Żabka"
  },
  {
    "km": 713.0,
    "town": "Nowy Dwór",
    "type": "POI",
    "description": "McDonalds, Stacja MOL, Neonet, Martes Sport"
  },
  {
    "km": 720.5,
    "town": "",
    "type": "UJEB",
    "description": "Zakroczymska Sawanna"
  },
  {
    "km": 722.4,
    "town": "Zakroczym",
    "type": "SKLEP ŻABKA",
    "description": "(6-23)"
  },
  {
    "km": 738.7,
    "town": "Wychódźc",
    "type": "POI",
    "description": "SKLEP"
  },
  {
    "km": 746.7,
    "town": "Czerwińsk",
    "type": "POI",
    "description": "SKLEP Dino (6-22.30)"
  },
  {
    "km": 747.5,
    "town": "Czerwińsk",
    "type": "POI",
    "description": "STACJA i SKLEP (7-19)"
  },
  {
    "km": 755.5,
    "town": "Wyszogród",
    "type": "POI",
    "description": "SKLEP Żabka"
  },
  {
    "km": 759.0,
    "town": "",
    "type": "UJEB",
    "description": "Okrągła Góra"
  },
  {
    "km": 769.0,
    "town": "",
    "type": "POI",
    "description": "PITSTOP PODGÓRZE"
  },
  {
    "km": 786.0,
    "town": "Wykowo",
    "type": "SKLEP",
    "description": "(6-19)"
  },
  {
    "km": 804.0,
    "town": "Płock",
    "type": "SKLEP",
    "description": "Żabka"
  },
  {
    "km": 804.0,
    "town": "Płock",
    "type": "NOCLEG",
    "description": "HOTEL TUMSKI - Piekarska 9, 09-400 Płock, Polska - 242629060"
  },
  {
    "km": 805.0,
    "town": "Płock",
    "type": "NOCLEG",
    "description": "Willa Adriana - Kazimierza Wielkiego 13, 09-400 Płock, Polska - 602133160"
  },
  {
    "km": 806.0,
    "town": "Płock",
    "type": "NOCLEG",
    "description": "Noclegi przy Jasnej - Jasna 3A, 09-400 Płock, Polska - 501105844"
  },
  {
    "km": 810.0,
    "town": "Maszewo",
    "type": "SKLEP DINO",
    "description": "(6-22.30)"
  },
  {
    "km": 829.0,
    "town": "",
    "type": "UJEB",
    "description": "Mostki pana Waldka"
  },
  {
    "km": 833.5,
    "town": "Dobrzyń",
    "type": "NOCLEG",
    "description": "Noclegi nad Wisłą - Farna 7, 87-610 Dobrzyń nad Wisłą, Polska - 600812151"
  },
  {
    "km": 834.6,
    "town": "Dobrzyń",
    "type": "POI",
    "description": "SKLEP DINO (6-22.30)"
  },
  {
    "km": 856.7,
    "town": "Włocławek",
    "type": "NOCLEG",
    "description": "Hotel Riverside - Piwna 3, 87-822 Włocławek, Polska - 542345206"
  },
  {
    "km": 857.0,
    "town": "Włocławek",
    "type": "POI",
    "description": "SKLEP Żabka"
  },
  {
    "km": 872.0,
    "town": "Bobrowniki",
    "type": "POI",
    "description": "SKLEP Dino"
  },
  {
    "km": 872.0,
    "town": "Bobrowniki",
    "type": "NOCLEGI",
    "description": "Agroturystyka - Nieszawska 20, 87-617 Bobrowniki, Polska - 785604171"
  },
  {
    "km": 892.8,
    "town": "",
    "type": "POI",
    "description": "Cmentarz Olenderski"
  },
  {
    "km": 900.0,
    "town": "Silno",
    "type": "POI",
    "description": "SKLEP Żabka (6-23)"
  },
  {
    "km": 903.0,
    "town": "Grabówiec",
    "type": "POI",
    "description": "SKLEP DINO (6-22.30)"
  },
  {
    "km": 904.0,
    "town": "Grabówiec",
    "type": "NOCLEG",
    "description": "Poranna Rosa - Syrenki 1, 87-162 Grabowiec, Polska - 505948938"
  },
  {
    "km": 908.4,
    "town": "",
    "type": "UJEB",
    "description": "Rybacka Ścieżka Przed Toruniem"
  },
  {
    "km": 912.0,
    "town": "Toruń",
    "type": "NOCLEG",
    "description": "Winnica Apartament - Winnica 45c/4, 87-100 Toruń, Polska - 883155854"
  },
  {
    "km": 918.2,
    "town": "Toruń",
    "type": "POI",
    "description": "SKLEP Żabka (w prawo do góry zjechać z trasy)"
  },
  {
    "km": 924.4,
    "town": "",
    "type": "UJEB",
    "description": "Toruńskie Wały"
  },
  {
    "km": 946.3,
    "town": "",
    "type": "POI",
    "description": "Koniec Wałów"
  },
  {
    "km": 953.0,
    "town": "Strzyżawa",
    "type": "NOCLEG",
    "description": "Strzyżawa 48, 86-070 Strzyżawa, Polska - 523439219"
  },
  {
    "km": 955.0,
    "town": "Ostromecko",
    "type": "POI",
    "description": "SKLEP Żabka"
  },
  {
    "km": 960.0,
    "town": "",
    "type": "NOCLEG",
    "description": "Spanie Pień"
  },
  {
    "km": 980.0,
    "town": "Agroturystyka Zielony Gaj",
    "type": "NOCLEG",
    "description": "Starogród 62, 86-200 Chełmno, Polska - 602798546"
  },
  {
    "km": 980.0,
    "town": "Starogród",
    "type": "NOCLEG",
    "description": "Czereśniowy Sad - Starogród 20, 86-200 Starogród, Polska - 609950011"
  },
  {
    "km": 984.5,
    "town": "",
    "type": "UJEB",
    "description": "Góra Wawrzyńca"
  },
  {
    "km": 989.0,
    "town": "Chełmno",
    "type": "POI",
    "description": "SKLEP Żabka"
  },
  {
    "km": 990.0,
    "town": "Chełmno",
    "type": "NOCLEG",
    "description": "Hotelik - Podmurna 3, 86-200 Chełmno, Polska - 500773181"
  },
  {
    "km": 990.0,
    "town": "Chełmno",
    "type": "NOCLEG",
    "description": "Stary Spichrz - Podmurna 7, 86-200 Chełmno, Polska - 537311090"
  },
  {
    "km": 990.0,
    "town": "Chełmno",
    "type": "NOCLEG",
    "description": "Pod Górą - Podgórna 3a, 86-200 Chełmno, Polska - 695761574"
  },
  {
    "km": 994.0,
    "town": "Chełmno",
    "type": "NOCLEG",
    "description": "u Agatki - Nowe Dobra 43A, 86-200 Chełmno, Polska - 691598605"
  },
  {
    "km": 1015.0,
    "town": "Grudziądz",
    "type": "POI",
    "description": "STACJA Orlen"
  },
  {
    "km": 1016.0,
    "town": "",
    "type": "UJEB",
    "description": "Single Track"
  },
  {
    "km": 1020.0,
    "town": "Grudziądz",
    "type": "POI",
    "description": "SKLEP Groszek (6-22)"
  },
  {
    "km": 1022.0,
    "town": "Grudziądz",
    "type": "POI",
    "description": "SKLEP Żabka"
  },
  {
    "km": 1022.0,
    "town": "Grudziądz",
    "type": "POI",
    "description": "Ruiny Zamku Krzyżackiego"
  },
  {
    "km": 1026.0,
    "town": "Grudziądz",
    "type": "POI",
    "description": "Cmentarz Mennonicki"
  },
  {
    "km": 1030.0,
    "town": "",
    "type": "UJEB",
    "description": "Góry Łosiowe"
  },
  {
    "km": 1039.5,
    "town": "Glina",
    "type": "POI",
    "description": "SKLEP"
  },
  {
    "km": 1047.9,
    "town": "Kaniczki",
    "type": "POI",
    "description": "SKLEP u Ewy (6-18.30)"
  },
  {
    "km": 1050.0,
    "town": "Grabowo Agroturystyka",
    "type": "NOCLEGI",
    "description": "Grabowo 20, 82-500 Sadlinki, Polska - 662480127"
  },
  {
    "km": 1053.0,
    "town": "Nowy Dwór",
    "type": "POI",
    "description": "SKLEP ABC"
  },
  {
    "km": 1053.0,
    "town": "Nowy Dwór",
    "type": "AGROTURYSTYKA",
    "description": "Grabówko 19, 82-500, Polska - 518485268"
  },
  {
    "km": 1059.8,
    "town": "Korzeniewo",
    "type": "POI",
    "description": "SKLEP GS (6-21)"
  },
  {
    "km": 1074.0,
    "town": "Gniew",
    "type": "POI",
    "description": "SKLEP Żabka"
  },
  {
    "km": 1096.0,
    "town": "Mała Słońca",
    "type": "POI",
    "description": "SKLEP (8-12, 17-19)"
  },
  {
    "km": 1105.0,
    "town": "Tczew",
    "type": "NOCLEGI",
    "description": "Czyżykowska 67, 83-110 Tczew, Polska - 587702126"
  },
  {
    "km": 1106.5,
    "town": "Tczew",
    "type": "NOCLEGI",
    "description": "Żeglarska 3, 83-110 Tczew, Polska - 575344355"
  },
  {
    "km": 1114.0,
    "town": "",
    "type": "UJEB",
    "description": "Łąki Tczewskie"
  },
  {
    "km": 1130.0,
    "town": "Kiezmark",
    "type": "POI",
    "description": "SKLEP (6-19)"
  },
  {
    "km": 1144.0,
    "town": "",
    "type": "POI",
    "description": "UJŚCIE MARTWEJ WISŁY"
  },
  {
    "km": 1170.0,
    "town": "",
    "type": "POI",
    "description": "META"
  }
];

const dateSelect = document.querySelector("#dateSelect");
const refreshButton = document.querySelector("#refreshButton");
const clearCacheButton = document.querySelector("#clearCacheButton");
const statusEl = document.querySelector("#status");
const forecastEl = document.querySelector("#forecast");
const shopsFiltersEl = document.querySelector("#shopsFilters");
const shopsListEl = document.querySelector("#shopsList");
const currentKmInput = document.querySelector("#currentKm");
const grossSpeedInput = document.querySelector("#grossSpeed");
const rideStartTimeInput = document.querySelector("#rideStartTime");
const defaultRideStartInput = document.querySelector("#defaultRideStart");
const defaultRideEndInput = document.querySelector("#defaultRideEnd");
const individualRideTimesInput = document.querySelector("#individualRideTimes");
const rideSettingsEl = document.querySelector("#rideSettings");
const toggleRideSettingsButton = document.querySelector("#toggleRideSettings");
const rideDaysEl = document.querySelector("#rideDays");
const calculateRideButton = document.querySelector("#calculateRide");
const clearRideSettingsButton = document.querySelector("#clearRideSettings");
const rideResultEl = document.querySelector("#rideResult");
let forecasts = [];
let rideRecalculateTimer = null;

init();

function init() {
  initTabs();
  renderShopFilters();
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
  toggleRideSettingsButton.addEventListener("click", toggleRideSettings);
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
  scheduleRideCalculation();
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

function renderShopFilters() {
  const categories = [...new Set(pois.map(poiCategory))].sort((a, b) => a.localeCompare(b, "pl"));
  shopsFiltersEl.innerHTML = `
    <button id="toggleShopFilters" type="button" class="btn btn-sm btn-outline-secondary shop-filter-toggle">Odznacz wszystkie</button>
    ${categories.map((category) => `
      <label class="form-check shop-filter">
        <input class="form-check-input" type="checkbox" value="${category}" checked>
        <span class="form-check-label">${category}</span>
      </label>
    `).join("")}
  `;
  shopsFiltersEl.addEventListener("change", () => {
    updateShopFiltersToggle();
    renderShops();
  });
  shopsFiltersEl.querySelector("#toggleShopFilters").addEventListener("click", toggleShopFilters);
}

function toggleShopFilters() {
  const inputs = Array.from(shopsFiltersEl.querySelectorAll("input[type='checkbox']"));
  const shouldSelectAll = inputs.some((input) => !input.checked);
  inputs.forEach((input) => input.checked = shouldSelectAll);
  updateShopFiltersToggle();
  renderShops();
}

function updateShopFiltersToggle() {
  const inputs = Array.from(shopsFiltersEl.querySelectorAll("input[type='checkbox']"));
  const button = shopsFiltersEl.querySelector("#toggleShopFilters");
  if (button) button.textContent = inputs.every((input) => input.checked) ? "Odznacz wszystkie" : "Zaznacz wszystkie";
}

function renderShops() {
  const selectedCategories = new Set(Array.from(shopsFiltersEl.querySelectorAll("input:checked")).map((input) => input.value));
  const filteredPois = pois.filter((poi) => selectedCategories.has(poiCategory(poi)));

  shopsListEl.innerHTML = filteredPois.map((poi) => {
    const category = poiCategory(poi);
    return `
      <article class="shop-item poi-${categoryClass(category)}">
        <span class="shop-km">${fmt(poi.km)} km</span>
        <strong class="shop-town">${poi.town || category}</strong>
        <span class="shop-desc"><span class="poi-type">${category}</span> ${linkPhones(poi.description)}</span>
      </article>
    `;
  }).join("") || `<div class="shops-empty">Brak POI dla wybranych kategorii.</div>`;
}

function poiCategory(poi) {
  const type = poi.type.toUpperCase();
  const description = poi.description.toUpperCase();
  const town = poi.town.toUpperCase();
  if (type.includes("ŻABKA") || description.includes("ŻABKA")) return "ŻABKA";
  if (type.includes("NOCLEG") || type.includes("AGROTURYSTYKA")) return "NOCLEG";
  if (type.includes("BISTRO") || type.includes("BISTO") || type.includes("RESTAURACJA") || description.includes("BISTRO") || description.includes("RESTAURACJA") || description.includes("MCDONALD") || description.includes("SNACK BAR")) return "BISTRO / REST";
  if (type.includes("STACJA") || description.includes("STACJA") || description.includes("ORLEN") || description.includes("MOL")) return "STACJA";
  if (type.includes("SKLEP") || type.includes("PIEKARNIA") || description.includes("SKLEP") || description.includes("PIEKARNIA") || description.includes("DINO") || description.includes("ODIDO") || description.includes("GROSZEK") || description.includes("ABC") || town.includes("SKLEP")) return "SKLEP";
  return poi.type;
}

function categoryClass(category) {
  return `poi-${category.toLowerCase().replaceAll("ż", "z").replaceAll("/", "").replaceAll(" ", "-")}`;
}

function linkPhones(text) {
  return text.replace(/(?:\+48\s*)?(\d{3})[\s-]?(\d{3})[\s-]?(\d{3})/g, (_match, first, second, third) => {
    const number = `${first}${second}${third}`;
    return `<a href="tel:+48${number}">${first} ${second} ${third}</a>`;
  });
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
      <label>
        Śr. brutto
        <input class="form-control ride-speed" type="number" min="1" step="0.5" value="16">
      </label>
    </div>
  `).join("");
}

function toggleRideSettings() {
  const collapsed = !rideSettingsEl.classList.contains("collapsed");
  setRideSettingsCollapsed(collapsed);
  saveRideSettings();
}

function setRideSettingsCollapsed(collapsed) {
  rideSettingsEl.classList.toggle("collapsed", collapsed);
  toggleRideSettingsButton.textContent = collapsed ? "Pokaż ustawienia" : "Zwiń ustawienia";
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
  setRideSettingsCollapsed(false);
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
      end: day.querySelector(".ride-end").value,
      speed: day.querySelector(".ride-speed").value
    }));
    localStorage.setItem(RIDE_SETTINGS_KEY, JSON.stringify({
      currentKm: currentKmInput.value,
      grossSpeed: grossSpeedInput.value,
      rideStartTime: rideStartTimeInput.value,
      defaultRideStart: defaultRideStartInput.value,
      defaultRideEnd: defaultRideEndInput.value,
      version: RIDE_SETTINGS_VERSION,
      individualRideTimes: individualRideTimesInput.checked,
      rideSettingsCollapsed: rideSettingsEl.classList.contains("collapsed"),
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
    setRideSettingsCollapsed(Boolean(settings.rideSettingsCollapsed));
    settings.days?.forEach((savedDay) => {
      const day = rideDaysEl.querySelector(`.ride-day[data-date="${savedDay.date}"]`);
      if (!day) return;
      if (savedDay.start) day.querySelector(".ride-start").value = savedDay.start;
      if (savedDay.end) day.querySelector(".ride-end").value = savedDay.end;
      if (savedDay.speed) day.querySelector(".ride-speed").value = savedDay.speed;
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
    const daySpeed = individual ? Number(dayEl.querySelector(".ride-speed").value) || speed : speed;
    if (previousArrivalTime) totalBreakHours += overnightBreakHours(previousArrivalTime, start);

    const availableHours = rideHours(start, end);
    const startKm = currentKm;
    const remainingKm = 1200 - startKm;
    const neededHours = remainingKm / daySpeed;
    const reachesFinish = neededHours <= availableHours;
    const hours = reachesFinish ? neededHours : availableHours;
    const endKm = reachesFinish ? 1200 : startKm + hours * daySpeed;
    const arrivalTime = reachesFinish ? addHoursToTime(start, neededHours) : end;
    const dayForecasts = await forecastsForRideDate(date);
    const checkpoints = rideCheckpoints(startKm, endKm, start, daySpeed, date, dayForecasts);
    const weatherSummary = rideDayWeatherSummary(checkpoints);

    totalHours += hours;
    rows.push({ date, start, end, speed: daySpeed, arrivalTime, hours, totalHours, startKm, endKm, checkpoints, weatherSummary, reachesFinish });
    currentKm = endKm;
    previousArrivalTime = arrivalTime;

    if (reachesFinish) {
      finish = { date, time: arrivalTime, totalHours, totalBreakHours };
      break;
    }
  }

  const lastRow = rows.at(-1);
  const summary = finish
    ? renderRideSummary({
        title: "META",
        date: finish.date,
        time: finish.time,
        gross: grossElapsedHours(finish.date, finish.time),
        ride: 1200 / speed,
        breaks: breakHoursFromStart(finish.date, finish.time),
        ok: true
      })
    : renderRideSummary({
        title: "NIE DOJEŻDŻASZ",
        date: lastRow?.date,
        time: lastRow?.arrivalTime,
        gross: lastRow ? grossElapsedHours(lastRow.date, lastRow.arrivalTime) : null,
        ride: lastRow ? lastRow.endKm / speed : null,
        breaks: lastRow ? breakHoursFromStart(lastRow.date, lastRow.arrivalTime) : null,
        ok: false
      });
  rideResultEl.innerHTML = summary + rows.map(renderRideRow).join("");
}

function renderRideSummary(summary) {
  return `
    <section class="ride-summary-card ${summary.ok ? "ok" : "warning"}">
      <div class="ride-summary-title">${summary.title}</div>
      <div class="ride-summary-date">${summary.date ? `${formatLongDate(summary.date)} · ${summary.time}` : "—"}</div>
      <div class="ride-summary-metrics">
        <div><span>Czas brutto</span><strong>${summary.gross === null ? "—" : formatDuration(summary.gross)}</strong></div>
        <div><span>Sama jazda</span><strong>${summary.ride === null ? "—" : formatDuration(summary.ride)}</strong></div>
        <div><span>Przerwy</span><strong>${summary.breaks === null ? "—" : formatDuration(summary.breaks)}</strong></div>
      </div>
    </section>
  `;
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
        <span>${row.start}–${row.arrivalTime}, ${formatDuration(row.hours)}, ${fmt(row.speed)} km/h</span>
      </div>
      <div class="ride-day-range">
        <span><span class="metric-title">Start</span><strong>${fmt(row.startKm)} km</strong></span>
        <span><span class="metric-title">Koniec</span><strong>${fmt(row.endKm)} km</strong>${row.reachesFinish ? `<span class="ok d-block">meta ${row.arrivalTime}</span>` : ""}</span>
        <span><span class="metric-title">Odległość</span><strong>${fmt(row.endKm - row.startKm)} km</strong></span>
      </div>
      <div class="ride-day-weather">${renderRideDayWeather(row.weatherSummary)}</div>
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

function renderRideDayWeather(summary) {
  if (!summary) return `<span class="warning">pogoda niedostępna</span>`;
  return `
    <span><strong>${fmt(summary.tempMin)}–${fmt(summary.tempMax)}°C</strong></span>
    <span class="rain ${rainStatus({ maxHourlyRain: summary.maxRain, precipitationSum: summary.rainSum, rainPeriods: [] }).level}">${rainDayLabel(summary)}</span>
  `;
}

function rainDayLabel(summary) {
  const status = rainStatus({ maxHourlyRain: summary.maxRain });
  if (status.level === "dry") return "opady: brak / śladowe";
  return `opady: ${status.label}, suma ${fmt(summary.rainSum)} mm, max ${fmt(summary.maxRain)} mm/h`;
}

function renderRideCheckpoint(checkpoint) {
  const weather = checkpoint.weather;
  const mud = mudAlert(checkpoint.point, weather);
  const weatherHtml = weather ? `
    <span>${fmt(weather.temperature)}°C</span>
    <span>wiatr ${fmt(weather.windSpeed)} km/h (${fmt(weather.windGusts)}) · ${relativeWindBadge(weather.relativeWind)}</span>
    <span class="rain ${rainStatus({ maxHourlyRain: weather.precipitation, precipitationSum: weather.precipitation, rainPeriods: [] }).level}">${rainHourLabel(weather.precipitation)}</span>
    ${mud ? `<span class="mud-alert ${mud.level}">${mud.text}</span>` : ""}
  ` : `<span class="warning">pogoda niedostępna</span>`;

  return `
    <div class="ride-checkpoint">
      <div><strong>${checkpoint.time}</strong><span>${checkpoint.point.km} km</span></div>
      <div><strong>${checkpoint.point.name}</strong></div>
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

function rideDayWeatherSummary(checkpoints) {
  const weather = checkpoints.map((checkpoint) => checkpoint.weather).filter(Boolean);
  if (!weather.length) return null;
  return {
    tempMin: Math.min(...weather.map((item) => item.temperature).filter((value) => Number.isFinite(Number(value))).map(Number)),
    tempMax: Math.max(...weather.map((item) => item.temperature).filter((value) => Number.isFinite(Number(value))).map(Number)),
    rainSum: weather.reduce((sum, item) => sum + ((item.precipitation || 0) >= 0.2 ? item.precipitation : 0), 0),
    maxRain: Math.max(0, ...weather.map((item) => item.precipitation || 0))
  };
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
      ${metric("Wiatr vs jazda", relativeWindBadge(card.relativeWind))}
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
      <td>${degToCompass(hour.windDirection)} · ${relativeWindBadge(relativeWind(hour.windDirection, hour.travelDirection))}</td>
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

function relativeWindBadge(value) {
  const level = value === "w ryj" ? "head" : value === "w plecy" ? "tail" : value === "boczny" ? "side" : "";
  return `<span class="relative-wind ${level}">${value}</span>`;
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

function formatLongDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pl-PL", {
    weekday: "long",
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
