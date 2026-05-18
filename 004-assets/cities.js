// Major non-capital cities for major countries.
// Format matches CAPITALS but with type: "major". Capitals stay in capitals.js.
window.MAJOR_CITIES = [
  // United States
  { name: "New York",       country: "United States", iso: "US", lat: 40.7128, lng: -74.0060, region: "Americas" },
  { name: "Los Angeles",    country: "United States", iso: "US", lat: 34.0522, lng: -118.2437,region: "Americas" },
  { name: "Chicago",        country: "United States", iso: "US", lat: 41.8781, lng: -87.6298, region: "Americas" },
  { name: "Houston",        country: "United States", iso: "US", lat: 29.7604, lng: -95.3698, region: "Americas" },
  { name: "Phoenix",        country: "United States", iso: "US", lat: 33.4484, lng: -112.0740,region: "Americas" },
  { name: "Philadelphia",   country: "United States", iso: "US", lat: 39.9526, lng: -75.1652, region: "Americas" },
  { name: "San Antonio",    country: "United States", iso: "US", lat: 29.4241, lng: -98.4936, region: "Americas" },
  { name: "San Diego",      country: "United States", iso: "US", lat: 32.7157, lng: -117.1611,region: "Americas" },
  { name: "Dallas",         country: "United States", iso: "US", lat: 32.7767, lng: -96.7970, region: "Americas" },
  { name: "San Jose",       country: "United States", iso: "US", lat: 37.3382, lng: -121.8863,region: "Americas" },
  { name: "Austin",         country: "United States", iso: "US", lat: 30.2672, lng: -97.7431, region: "Americas" },
  { name: "Seattle",        country: "United States", iso: "US", lat: 47.6062, lng: -122.3321,region: "Americas" },
  { name: "Boston",         country: "United States", iso: "US", lat: 42.3601, lng: -71.0589, region: "Americas" },
  { name: "Miami",          country: "United States", iso: "US", lat: 25.7617, lng: -80.1918, region: "Americas" },
  { name: "Atlanta",        country: "United States", iso: "US", lat: 33.7490, lng: -84.3880, region: "Americas" },
  { name: "Denver",         country: "United States", iso: "US", lat: 39.7392, lng: -104.9903,region: "Americas" },
  { name: "San Francisco",  country: "United States", iso: "US", lat: 37.7749, lng: -122.4194,region: "Americas" },
  { name: "Las Vegas",      country: "United States", iso: "US", lat: 36.1699, lng: -115.1398,region: "Americas" },
  { name: "Detroit",        country: "United States", iso: "US", lat: 42.3314, lng: -83.0458, region: "Americas" },
  { name: "Portland",       country: "United States", iso: "US", lat: 45.5152, lng: -122.6784,region: "Americas" },
  { name: "Honolulu",       country: "United States", iso: "US", lat: 21.3099, lng: -157.8581,region: "Americas" },
  { name: "Anchorage",      country: "United States", iso: "US", lat: 61.2181, lng: -149.9003,region: "Americas" },

  // China
  { name: "Shanghai",       country: "China", iso: "CN", lat: 31.2304, lng: 121.4737, region: "Asia" },
  { name: "Guangzhou",      country: "China", iso: "CN", lat: 23.1291, lng: 113.2644, region: "Asia" },
  { name: "Shenzhen",       country: "China", iso: "CN", lat: 22.5431, lng: 114.0579, region: "Asia" },
  { name: "Chongqing",      country: "China", iso: "CN", lat: 29.4316, lng: 106.9123, region: "Asia" },
  { name: "Tianjin",        country: "China", iso: "CN", lat: 39.3434, lng: 117.3616, region: "Asia" },
  { name: "Wuhan",          country: "China", iso: "CN", lat: 30.5928, lng: 114.3055, region: "Asia" },
  { name: "Chengdu",        country: "China", iso: "CN", lat: 30.5728, lng: 104.0668, region: "Asia" },
  { name: "Hangzhou",       country: "China", iso: "CN", lat: 30.2741, lng: 120.1551, region: "Asia" },
  { name: "Nanjing",        country: "China", iso: "CN", lat: 32.0603, lng: 118.7969, region: "Asia" },
  { name: "Xi'an",          country: "China", iso: "CN", lat: 34.3416, lng: 108.9398, region: "Asia" },
  { name: "Suzhou",         country: "China", iso: "CN", lat: 31.2989, lng: 120.5853, region: "Asia" },
  { name: "Qingdao",        country: "China", iso: "CN", lat: 36.0671, lng: 120.3826, region: "Asia" },
  { name: "Dalian",         country: "China", iso: "CN", lat: 38.9140, lng: 121.6147, region: "Asia" },
  { name: "Xiamen",         country: "China", iso: "CN", lat: 24.4798, lng: 118.0894, region: "Asia" },
  { name: "Kunming",        country: "China", iso: "CN", lat: 25.0389, lng: 102.7183, region: "Asia" },
  { name: "Shenyang",       country: "China", iso: "CN", lat: 41.8057, lng: 123.4315, region: "Asia" },
  { name: "Harbin",         country: "China", iso: "CN", lat: 45.8038, lng: 126.5350, region: "Asia" },
  { name: "Changsha",       country: "China", iso: "CN", lat: 28.2282, lng: 112.9388, region: "Asia" },
  { name: "Hong Kong",      country: "China",     iso: "HK", lat: 22.3193, lng: 114.1694, region: "Asia" },
  { name: "Macau",          country: "China",     iso: "MO", lat: 22.1987, lng: 113.5439, region: "Asia" },
  { name: "Taipei",         country: "China",     iso: "TW", lat: 25.0330, lng: 121.5654, region: "Asia" },
  { name: "Lhasa",          country: "China",     iso: "CN", lat: 29.6520, lng: 91.1721,  region: "Asia" },
  { name: "Urumqi",         country: "China",     iso: "CN", lat: 43.8256, lng: 87.6168,  region: "Asia" },

  // Japan
  { name: "Osaka",          country: "Japan", iso: "JP", lat: 34.6937, lng: 135.5023, region: "Asia" },
  { name: "Yokohama",       country: "Japan", iso: "JP", lat: 35.4437, lng: 139.6380, region: "Asia" },
  { name: "Nagoya",         country: "Japan", iso: "JP", lat: 35.1815, lng: 136.9066, region: "Asia" },
  { name: "Sapporo",        country: "Japan", iso: "JP", lat: 43.0618, lng: 141.3545, region: "Asia" },
  { name: "Fukuoka",        country: "Japan", iso: "JP", lat: 33.5904, lng: 130.4017, region: "Asia" },
  { name: "Kobe",           country: "Japan", iso: "JP", lat: 34.6901, lng: 135.1956, region: "Asia" },
  { name: "Kyoto",          country: "Japan", iso: "JP", lat: 35.0116, lng: 135.7681, region: "Asia" },
  { name: "Hiroshima",      country: "Japan", iso: "JP", lat: 34.3853, lng: 132.4553, region: "Asia" },

  // India
  { name: "Mumbai",         country: "India", iso: "IN", lat: 19.0760, lng: 72.8777, region: "Asia" },
  { name: "Bangalore",      country: "India", iso: "IN", lat: 12.9716, lng: 77.5946, region: "Asia" },
  { name: "Kolkata",        country: "India", iso: "IN", lat: 22.5726, lng: 88.3639, region: "Asia" },
  { name: "Chennai",        country: "India", iso: "IN", lat: 13.0827, lng: 80.2707, region: "Asia" },
  { name: "Hyderabad",      country: "India", iso: "IN", lat: 17.3850, lng: 78.4867, region: "Asia" },
  { name: "Ahmedabad",      country: "India", iso: "IN", lat: 23.0225, lng: 72.5714, region: "Asia" },
  { name: "Pune",           country: "India", iso: "IN", lat: 18.5204, lng: 73.8567, region: "Asia" },
  { name: "Jaipur",         country: "India", iso: "IN", lat: 26.9124, lng: 75.7873, region: "Asia" },
  { name: "Lucknow",        country: "India", iso: "IN", lat: 26.8467, lng: 80.9462, region: "Asia" },

  // Russia
  { name: "Saint Petersburg", country: "Russia", iso: "RU", lat: 59.9311, lng: 30.3609, region: "Europe" },
  { name: "Novosibirsk",      country: "Russia", iso: "RU", lat: 55.0084, lng: 82.9357, region: "Asia" },
  { name: "Yekaterinburg",    country: "Russia", iso: "RU", lat: 56.8389, lng: 60.6057, region: "Asia" },
  { name: "Vladivostok",      country: "Russia", iso: "RU", lat: 43.1198, lng: 131.8869,region: "Asia" },
  { name: "Kazan",            country: "Russia", iso: "RU", lat: 55.8304, lng: 49.0661, region: "Europe" },
  { name: "Sochi",            country: "Russia", iso: "RU", lat: 43.6028, lng: 39.7342, region: "Europe" },

  // Brazil
  { name: "São Paulo",      country: "Brazil", iso: "BR", lat: -23.5505,lng: -46.6333, region: "Americas" },
  { name: "Rio de Janeiro", country: "Brazil", iso: "BR", lat: -22.9068,lng: -43.1729, region: "Americas" },
  { name: "Salvador",       country: "Brazil", iso: "BR", lat: -12.9714,lng: -38.5014, region: "Americas" },
  { name: "Fortaleza",      country: "Brazil", iso: "BR", lat: -3.7172, lng: -38.5433, region: "Americas" },
  { name: "Belo Horizonte", country: "Brazil", iso: "BR", lat: -19.9167,lng: -43.9345, region: "Americas" },
  { name: "Manaus",         country: "Brazil", iso: "BR", lat: -3.1190, lng: -60.0217, region: "Americas" },
  { name: "Curitiba",       country: "Brazil", iso: "BR", lat: -25.4284,lng: -49.2733, region: "Americas" },

  // Germany
  { name: "Hamburg",        country: "Germany", iso: "DE", lat: 53.5511, lng: 9.9937,  region: "Europe" },
  { name: "Munich",         country: "Germany", iso: "DE", lat: 48.1351, lng: 11.5820, region: "Europe" },
  { name: "Cologne",        country: "Germany", iso: "DE", lat: 50.9375, lng: 6.9603,  region: "Europe" },
  { name: "Frankfurt",      country: "Germany", iso: "DE", lat: 50.1109, lng: 8.6821,  region: "Europe" },
  { name: "Stuttgart",      country: "Germany", iso: "DE", lat: 48.7758, lng: 9.1829,  region: "Europe" },
  { name: "Düsseldorf",     country: "Germany", iso: "DE", lat: 51.2277, lng: 6.7735,  region: "Europe" },

  // United Kingdom
  { name: "Manchester",     country: "United Kingdom", iso: "GB", lat: 53.4808, lng: -2.2426, region: "Europe" },
  { name: "Birmingham",     country: "United Kingdom", iso: "GB", lat: 52.4862, lng: -1.8904, region: "Europe" },
  { name: "Liverpool",      country: "United Kingdom", iso: "GB", lat: 53.4084, lng: -2.9916, region: "Europe" },
  { name: "Glasgow",        country: "United Kingdom", iso: "GB", lat: 55.8642, lng: -4.2518, region: "Europe" },
  { name: "Edinburgh",      country: "United Kingdom", iso: "GB", lat: 55.9533, lng: -3.1883, region: "Europe" },

  // France
  { name: "Marseille",      country: "France", iso: "FR", lat: 43.2965, lng: 5.3698,  region: "Europe" },
  { name: "Lyon",           country: "France", iso: "FR", lat: 45.7640, lng: 4.8357,  region: "Europe" },
  { name: "Toulouse",       country: "France", iso: "FR", lat: 43.6047, lng: 1.4442,  region: "Europe" },
  { name: "Nice",           country: "France", iso: "FR", lat: 43.7102, lng: 7.2620,  region: "Europe" },
  { name: "Bordeaux",       country: "France", iso: "FR", lat: 44.8378, lng: -0.5792, region: "Europe" },

  // Italy
  { name: "Milan",          country: "Italy", iso: "IT", lat: 45.4642, lng: 9.1900, region: "Europe" },
  { name: "Naples",         country: "Italy", iso: "IT", lat: 40.8518, lng: 14.2681,region: "Europe" },
  { name: "Turin",          country: "Italy", iso: "IT", lat: 45.0703, lng: 7.6869, region: "Europe" },
  { name: "Florence",       country: "Italy", iso: "IT", lat: 43.7696, lng: 11.2558,region: "Europe" },
  { name: "Venice",         country: "Italy", iso: "IT", lat: 45.4408, lng: 12.3155,region: "Europe" },

  // Spain
  { name: "Barcelona",      country: "Spain", iso: "ES", lat: 41.3851, lng: 2.1734,   region: "Europe" },
  { name: "Valencia",       country: "Spain", iso: "ES", lat: 39.4699, lng: -0.3763,  region: "Europe" },
  { name: "Seville",        country: "Spain", iso: "ES", lat: 37.3891, lng: -5.9845,  region: "Europe" },
  { name: "Bilbao",         country: "Spain", iso: "ES", lat: 43.2630, lng: -2.9350,  region: "Europe" },
  { name: "Málaga",         country: "Spain", iso: "ES", lat: 36.7213, lng: -4.4214,  region: "Europe" },

  // Canada
  { name: "Toronto",        country: "Canada", iso: "CA", lat: 43.6532, lng: -79.3832,region: "Americas" },
  { name: "Vancouver",      country: "Canada", iso: "CA", lat: 49.2827, lng: -123.1207,region: "Americas" },
  { name: "Montreal",       country: "Canada", iso: "CA", lat: 45.5017, lng: -73.5673, region: "Americas" },
  { name: "Calgary",        country: "Canada", iso: "CA", lat: 51.0447, lng: -114.0719,region: "Americas" },
  { name: "Edmonton",       country: "Canada", iso: "CA", lat: 53.5461, lng: -113.4938,region: "Americas" },
  { name: "Quebec City",    country: "Canada", iso: "CA", lat: 46.8139, lng: -71.2080, region: "Americas" },

  // Australia
  { name: "Sydney",         country: "Australia", iso: "AU", lat: -33.8688,lng: 151.2093,region: "Oceania" },
  { name: "Melbourne",      country: "Australia", iso: "AU", lat: -37.8136,lng: 144.9631,region: "Oceania" },
  { name: "Brisbane",       country: "Australia", iso: "AU", lat: -27.4698,lng: 153.0251,region: "Oceania" },
  { name: "Perth",          country: "Australia", iso: "AU", lat: -31.9523,lng: 115.8613,region: "Oceania" },
  { name: "Adelaide",       country: "Australia", iso: "AU", lat: -34.9285,lng: 138.6007,region: "Oceania" },
  { name: "Auckland",       country: "New Zealand", iso: "NZ", lat: -36.8485,lng: 174.7633,region: "Oceania" },

  // Mexico
  { name: "Guadalajara",    country: "Mexico", iso: "MX", lat: 20.6597, lng: -103.3496,region: "Americas" },
  { name: "Monterrey",      country: "Mexico", iso: "MX", lat: 25.6866, lng: -100.3161,region: "Americas" },
  { name: "Cancún",         country: "Mexico", iso: "MX", lat: 21.1619, lng: -86.8515, region: "Americas" },
  { name: "Tijuana",        country: "Mexico", iso: "MX", lat: 32.5149, lng: -117.0382,region: "Americas" },

  // Argentina
  { name: "Córdoba",        country: "Argentina", iso: "AR", lat: -31.4201,lng: -64.1888,region: "Americas" },
  { name: "Rosario",        country: "Argentina", iso: "AR", lat: -32.9442,lng: -60.6505,region: "Americas" },
  { name: "Mendoza",        country: "Argentina", iso: "AR", lat: -32.8908,lng: -68.8272,region: "Americas" },

  // South Korea
  { name: "Busan",          country: "South Korea", iso: "KR", lat: 35.1796, lng: 129.0756,region: "Asia" },
  { name: "Incheon",        country: "South Korea", iso: "KR", lat: 37.4563, lng: 126.7052,region: "Asia" },
  { name: "Daegu",          country: "South Korea", iso: "KR", lat: 35.8714, lng: 128.6014,region: "Asia" },

  // Indonesia
  { name: "Surabaya",       country: "Indonesia", iso: "ID", lat: -7.2575, lng: 112.7521,region: "Asia" },
  { name: "Bandung",        country: "Indonesia", iso: "ID", lat: -6.9175, lng: 107.6191,region: "Asia" },
  { name: "Medan",          country: "Indonesia", iso: "ID", lat: 3.5952,  lng: 98.6722, region: "Asia" },
  { name: "Denpasar",       country: "Indonesia", iso: "ID", lat: -8.6705, lng: 115.2126,region: "Asia" },

  // Turkey
  { name: "Istanbul",       country: "Turkey", iso: "TR", lat: 41.0082, lng: 28.9784, region: "Europe" },
  { name: "Izmir",          country: "Turkey", iso: "TR", lat: 38.4192, lng: 27.1287, region: "Asia" },
  { name: "Antalya",        country: "Turkey", iso: "TR", lat: 36.8969, lng: 30.7133, region: "Asia" },

  // Saudi Arabia
  { name: "Jeddah",         country: "Saudi Arabia", iso: "SA", lat: 21.4858, lng: 39.1925, region: "Asia" },
  { name: "Mecca",          country: "Saudi Arabia", iso: "SA", lat: 21.3891, lng: 39.8579, region: "Asia" },
  { name: "Medina",         country: "Saudi Arabia", iso: "SA", lat: 24.5247, lng: 39.5692, region: "Asia" },

  // UAE
  { name: "Dubai",          country: "United Arab Emirates", iso: "AE", lat: 25.2048, lng: 55.2708,region: "Asia" },
  { name: "Sharjah",        country: "United Arab Emirates", iso: "AE", lat: 25.3463, lng: 55.4209,region: "Asia" },

  // Iran
  { name: "Mashhad",        country: "Iran", iso: "IR", lat: 36.2605, lng: 59.6168, region: "Asia" },
  { name: "Isfahan",        country: "Iran", iso: "IR", lat: 32.6546, lng: 51.6680, region: "Asia" },
  { name: "Shiraz",         country: "Iran", iso: "IR", lat: 29.5918, lng: 52.5837, region: "Asia" },

  // South Africa
  { name: "Cape Town",      country: "South Africa", iso: "ZA", lat: -33.9249,lng: 18.4241, region: "Africa" },
  { name: "Johannesburg",   country: "South Africa", iso: "ZA", lat: -26.2041,lng: 28.0473, region: "Africa" },
  { name: "Durban",         country: "South Africa", iso: "ZA", lat: -29.8587,lng: 31.0218, region: "Africa" },

  // Egypt
  { name: "Alexandria",     country: "Egypt", iso: "EG", lat: 31.2001, lng: 29.9187,region: "Africa" },
  { name: "Giza",           country: "Egypt", iso: "EG", lat: 30.0131, lng: 31.2089,region: "Africa" },

  // Nigeria
  { name: "Lagos",          country: "Nigeria", iso: "NG", lat: 6.5244,  lng: 3.3792, region: "Africa" },
  { name: "Kano",           country: "Nigeria", iso: "NG", lat: 12.0022, lng: 8.5920, region: "Africa" },

  // Pakistan
  { name: "Karachi",        country: "Pakistan", iso: "PK", lat: 24.8607, lng: 67.0011, region: "Asia" },
  { name: "Lahore",         country: "Pakistan", iso: "PK", lat: 31.5204, lng: 74.3587, region: "Asia" },
  { name: "Faisalabad",     country: "Pakistan", iso: "PK", lat: 31.4504, lng: 73.1350, region: "Asia" },
  { name: "Peshawar",       country: "Pakistan", iso: "PK", lat: 34.0151, lng: 71.5249, region: "Asia" },

  // Vietnam
  { name: "Ho Chi Minh City", country: "Vietnam", iso: "VN", lat: 10.8231, lng: 106.6297,region: "Asia" },
  { name: "Da Nang",          country: "Vietnam", iso: "VN", lat: 16.0544, lng: 108.2022,region: "Asia" },

  // Thailand
  { name: "Chiang Mai",     country: "Thailand", iso: "TH", lat: 18.7883, lng: 98.9853, region: "Asia" },
  { name: "Phuket",         country: "Thailand", iso: "TH", lat: 7.8804,  lng: 98.3923, region: "Asia" },

  // Philippines
  { name: "Cebu",           country: "Philippines", iso: "PH", lat: 10.3157, lng: 123.8854,region: "Asia" },
  { name: "Davao",          country: "Philippines", iso: "PH", lat: 7.1907,  lng: 125.4553,region: "Asia" },
  { name: "Quezon City",    country: "Philippines", iso: "PH", lat: 14.6760, lng: 121.0437,region: "Asia" },

  // Malaysia
  { name: "Penang",         country: "Malaysia", iso: "MY", lat: 5.4164,  lng: 100.3327,region: "Asia" },
  { name: "Johor Bahru",    country: "Malaysia", iso: "MY", lat: 1.4927,  lng: 103.7414,region: "Asia" },

  // Israel
  { name: "Tel Aviv",       country: "Israel", iso: "IL", lat: 32.0853, lng: 34.7818, region: "Asia" },
  { name: "Haifa",          country: "Israel", iso: "IL", lat: 32.7940, lng: 34.9896, region: "Asia" },

  // Switzerland
  { name: "Zurich",         country: "Switzerland", iso: "CH", lat: 47.3769, lng: 8.5417,  region: "Europe" },
  { name: "Geneva",         country: "Switzerland", iso: "CH", lat: 46.2044, lng: 6.1432,  region: "Europe" },
  { name: "Basel",          country: "Switzerland", iso: "CH", lat: 47.5596, lng: 7.5886,  region: "Europe" },

  // Netherlands
  { name: "Rotterdam",      country: "Netherlands", iso: "NL", lat: 51.9244, lng: 4.4777, region: "Europe" },
  { name: "The Hague",      country: "Netherlands", iso: "NL", lat: 52.0705, lng: 4.3007, region: "Europe" },

  // Belgium
  { name: "Antwerp",        country: "Belgium", iso: "BE", lat: 51.2194, lng: 4.4025, region: "Europe" },

  // Sweden
  { name: "Gothenburg",     country: "Sweden", iso: "SE", lat: 57.7089, lng: 11.9746, region: "Europe" },
  { name: "Malmö",          country: "Sweden", iso: "SE", lat: 55.6050, lng: 13.0038, region: "Europe" },

  // Poland
  { name: "Kraków",         country: "Poland", iso: "PL", lat: 50.0647, lng: 19.9450, region: "Europe" },
  { name: "Wrocław",        country: "Poland", iso: "PL", lat: 51.1079, lng: 17.0385, region: "Europe" },
  { name: "Gdańsk",         country: "Poland", iso: "PL", lat: 54.3520, lng: 18.6466, region: "Europe" },

  // Ukraine
  { name: "Kharkiv",        country: "Ukraine", iso: "UA", lat: 49.9935, lng: 36.2304, region: "Europe" },
  { name: "Odesa",          country: "Ukraine", iso: "UA", lat: 46.4825, lng: 30.7233, region: "Europe" },
  { name: "Lviv",           country: "Ukraine", iso: "UA", lat: 49.8397, lng: 24.0297, region: "Europe" },

  // Portugal
  { name: "Porto",          country: "Portugal", iso: "PT", lat: 41.1579, lng: -8.6291, region: "Europe" },

  // Greece
  { name: "Thessaloniki",   country: "Greece", iso: "GR", lat: 40.6401, lng: 22.9444, region: "Europe" },

  // Austria
  { name: "Salzburg",       country: "Austria", iso: "AT", lat: 47.8095, lng: 13.0550, region: "Europe" },
  { name: "Innsbruck",      country: "Austria", iso: "AT", lat: 47.2692, lng: 11.4041, region: "Europe" },

  // Other notable
  { name: "Istanbul",       country: "Turkey", iso: "TR_DUP", lat: 41.0082, lng: 28.9784, region: "Europe" }
];
// dedupe defensively (last Istanbul was a guard, remove)
window.MAJOR_CITIES = window.MAJOR_CITIES.filter(c => c.iso !== "TR_DUP");

// All cities merged (capitals + major), each with `type`
window.ALL_CITIES = [
  ...window.CAPITALS.map(c => ({ ...c, type: "capital" })),
  ...window.MAJOR_CITIES.map(c => ({ ...c, type: "major" }))
];
