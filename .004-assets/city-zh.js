// Chinese names for every city in CAPITALS + MAJOR_CITIES.
// Keyed by the exact English `name` string (accents / apostrophes included).
// cities.js attaches `zh` onto ALL_CITIES from this lookup; missing keys fall
// back to the English name and log a console.warn so gaps are easy to spot.
window.CITY_ZH = {
  // ---------- Capitals · Africa ----------
  "Algiers": "阿尔及尔",
  "Luanda": "罗安达",
  "Porto-Novo": "波多诺伏",
  "Gaborone": "哈博罗内",
  "Ouagadougou": "瓦加杜古",
  "Bujumbura": "布琼布拉",
  "Yaoundé": "雅温得",
  "Praia": "普拉亚",
  "Bangui": "班吉",
  "N'Djamena": "恩贾梅纳",
  "Moroni": "莫罗尼",
  "Kinshasa": "金沙萨",
  "Brazzaville": "布拉柴维尔",
  "Djibouti": "吉布提",
  "Cairo": "开罗",
  "Malabo": "马拉博",
  "Asmara": "阿斯马拉",
  "Mbabane": "姆巴巴纳",
  "Addis Ababa": "亚的斯亚贝巴",
  "Libreville": "利伯维尔",
  "Banjul": "班珠尔",
  "Accra": "阿克拉",
  "Conakry": "科纳克里",
  "Bissau": "比绍",
  "Yamoussoukro": "亚穆苏克罗",
  "Nairobi": "内罗毕",
  "Maseru": "马塞卢",
  "Monrovia": "蒙罗维亚",
  "Tripoli": "的黎波里",
  "Antananarivo": "塔那那利佛",
  "Lilongwe": "利隆圭",
  "Bamako": "巴马科",
  "Nouakchott": "努瓦克肖特",
  "Port Louis": "路易港",
  "Rabat": "拉巴特",
  "Maputo": "马普托",
  "Windhoek": "温得和克",
  "Niamey": "尼亚美",
  "Abuja": "阿布贾",
  "Kigali": "基加利",
  "São Tomé": "圣多美",
  "Dakar": "达喀尔",
  "Victoria": "维多利亚",
  "Freetown": "弗里敦",
  "Mogadishu": "摩加迪沙",
  "Pretoria": "比勒陀利亚",
  "Juba": "朱巴",
  "Khartoum": "喀土穆",
  "Dodoma": "多多马",
  "Lomé": "洛美",
  "Tunis": "突尼斯",
  "Kampala": "坎帕拉",
  "Lusaka": "卢萨卡",
  "Harare": "哈拉雷",

  // ---------- Capitals · Asia ----------
  "Kabul": "喀布尔",
  "Yerevan": "埃里温",
  "Baku": "巴库",
  "Manama": "麦纳麦",
  "Dhaka": "达卡",
  "Thimphu": "廷布",
  "Bandar Seri Begawan": "斯里巴加湾市",
  "Phnom Penh": "金边",
  "Beijing": "北京",
  "Nicosia": "尼科西亚",
  "Tbilisi": "第比利斯",
  "New Delhi": "新德里",
  "Jakarta": "雅加达",
  "Tehran": "德黑兰",
  "Baghdad": "巴格达",
  "Jerusalem": "耶路撒冷",
  "Tokyo": "东京",
  "Amman": "安曼",
  "Astana": "阿斯塔纳",
  "Kuwait City": "科威特城",
  "Bishkek": "比什凯克",
  "Vientiane": "万象",
  "Beirut": "贝鲁特",
  "Kuala Lumpur": "吉隆坡",
  "Malé": "马累",
  "Ulaanbaatar": "乌兰巴托",
  "Naypyidaw": "内比都",
  "Kathmandu": "加德满都",
  "Pyongyang": "平壤",
  "Muscat": "马斯喀特",
  "Islamabad": "伊斯兰堡",
  "Ramallah": "拉马拉",
  "Manila": "马尼拉",
  "Doha": "多哈",
  "Riyadh": "利雅得",
  "Singapore": "新加坡",
  "Seoul": "首尔",
  "Colombo": "科伦坡",
  "Damascus": "大马士革",
  "Dushanbe": "杜尚别",
  "Bangkok": "曼谷",
  "Dili": "帝力",
  "Ankara": "安卡拉",
  "Ashgabat": "阿什哈巴德",
  "Abu Dhabi": "阿布扎比",
  "Tashkent": "塔什干",
  "Hanoi": "河内",
  "Sana'a": "萨那",

  // ---------- Capitals · Europe ----------
  "Tirana": "地拉那",
  "Andorra la Vella": "安道尔城",
  "Vienna": "维也纳",
  "Minsk": "明斯克",
  "Brussels": "布鲁塞尔",
  "Sarajevo": "萨拉热窝",
  "Sofia": "索非亚",
  "Zagreb": "萨格勒布",
  "Prague": "布拉格",
  "Copenhagen": "哥本哈根",
  "Tallinn": "塔林",
  "Helsinki": "赫尔辛基",
  "Paris": "巴黎",
  "Berlin": "柏林",
  "Athens": "雅典",
  "Budapest": "布达佩斯",
  "Reykjavik": "雷克雅未克",
  "Dublin": "都柏林",
  "Rome": "罗马",
  "Pristina": "普里什蒂纳",
  "Riga": "里加",
  "Vaduz": "瓦杜兹",
  "Vilnius": "维尔纽斯",
  "Luxembourg": "卢森堡市",
  "Valletta": "瓦莱塔",
  "Chișinău": "基希讷乌",
  "Monaco": "摩纳哥",
  "Podgorica": "波德戈里察",
  "Amsterdam": "阿姆斯特丹",
  "Skopje": "斯科普里",
  "Oslo": "奥斯陆",
  "Warsaw": "华沙",
  "Lisbon": "里斯本",
  "Bucharest": "布加勒斯特",
  "Moscow": "莫斯科",
  "San Marino": "圣马力诺",
  "Belgrade": "贝尔格莱德",
  "Bratislava": "布拉迪斯拉发",
  "Ljubljana": "卢布尔雅那",
  "Madrid": "马德里",
  "Stockholm": "斯德哥尔摩",
  "Bern": "伯尔尼",
  "Kyiv": "基辅",
  "London": "伦敦",
  "Vatican City": "梵蒂冈城",

  // ---------- Capitals · Americas ----------
  "Buenos Aires": "布宜诺斯艾利斯",
  "Nassau": "拿骚",
  "Bridgetown": "布里奇敦",
  "Belmopan": "贝尔莫潘",
  "Sucre": "苏克雷",
  "Brasília": "巴西利亚",
  "Ottawa": "渥太华",
  "Santiago": "圣地亚哥",
  "Bogotá": "波哥大",
  "San José": "圣何塞",
  "Havana": "哈瓦那",
  "Roseau": "罗索",
  "Santo Domingo": "圣多明各",
  "Quito": "基多",
  "San Salvador": "圣萨尔瓦多",
  "St. George's": "圣乔治",
  "Guatemala City": "危地马拉城",
  "Georgetown": "乔治敦",
  "Port-au-Prince": "太子港",
  "Tegucigalpa": "特古西加尔巴",
  "Kingston": "金斯敦",
  "Mexico City": "墨西哥城",
  "Managua": "马那瓜",
  "Panama City": "巴拿马城",
  "Asunción": "亚松森",
  "Lima": "利马",
  "Basseterre": "巴斯特尔",
  "Castries": "卡斯特里",
  "Kingstown": "金斯敦",
  "St. John's": "圣约翰",
  "Paramaribo": "帕拉马里博",
  "Port of Spain": "西班牙港",
  "Washington D.C.": "华盛顿",
  "Montevideo": "蒙得维的亚",
  "Caracas": "加拉加斯",

  // ---------- Capitals · Oceania ----------
  "Canberra": "堪培拉",
  "Suva": "苏瓦",
  "Tarawa": "塔拉瓦",
  "Majuro": "马朱罗",
  "Palikir": "帕利基尔",
  "Yaren": "亚伦",
  "Wellington": "惠灵顿",
  "Ngerulmud": "恩吉鲁穆德",
  "Port Moresby": "莫尔兹比港",
  "Apia": "阿皮亚",
  "Honiara": "霍尼亚拉",
  "Nuku'alofa": "努库阿洛法",
  "Funafuti": "富纳富提",
  "Port Vila": "维拉港",

  // ---------- Major cities · United States ----------
  "New York": "纽约",
  "Los Angeles": "洛杉矶",
  "Chicago": "芝加哥",
  "Houston": "休斯顿",
  "Phoenix": "凤凰城",
  "Philadelphia": "费城",
  "San Antonio": "圣安东尼奥",
  "San Diego": "圣迭戈",
  "Dallas": "达拉斯",
  "San Jose": "圣何塞",
  "Austin": "奥斯汀",
  "Seattle": "西雅图",
  "Boston": "波士顿",
  "Miami": "迈阿密",
  "Atlanta": "亚特兰大",
  "Denver": "丹佛",
  "San Francisco": "旧金山",
  "Las Vegas": "拉斯维加斯",
  "Detroit": "底特律",
  "Portland": "波特兰",
  "Honolulu": "檀香山",
  "Anchorage": "安克雷奇",

  // ---------- Major cities · China ----------
  "Shanghai": "上海",
  "Guangzhou": "广州",
  "Shenzhen": "深圳",
  "Chongqing": "重庆",
  "Tianjin": "天津",
  "Wuhan": "武汉",
  "Chengdu": "成都",
  "Hangzhou": "杭州",
  "Nanjing": "南京",
  "Xi'an": "西安",
  "Suzhou": "苏州",
  "Qingdao": "青岛",
  "Dalian": "大连",
  "Xiamen": "厦门",
  "Kunming": "昆明",
  "Shenyang": "沈阳",
  "Harbin": "哈尔滨",
  "Changsha": "长沙",
  "Hong Kong": "香港",
  "Macau": "澳门",
  "Taipei": "台北",
  "Lhasa": "拉萨",
  "Urumqi": "乌鲁木齐",

  // ---------- Major cities · Japan ----------
  "Osaka": "大阪",
  "Yokohama": "横滨",
  "Nagoya": "名古屋",
  "Sapporo": "札幌",
  "Fukuoka": "福冈",
  "Kobe": "神户",
  "Kyoto": "京都",
  "Hiroshima": "广岛",

  // ---------- Major cities · India ----------
  "Mumbai": "孟买",
  "Bangalore": "班加罗尔",
  "Kolkata": "加尔各答",
  "Chennai": "金奈",
  "Hyderabad": "海得拉巴",
  "Ahmedabad": "艾哈迈达巴德",
  "Pune": "浦那",
  "Jaipur": "斋浦尔",
  "Lucknow": "勒克瑙",

  // ---------- Major cities · Russia ----------
  "Saint Petersburg": "圣彼得堡",
  "Novosibirsk": "新西伯利亚",
  "Yekaterinburg": "叶卡捷琳堡",
  "Vladivostok": "符拉迪沃斯托克",
  "Kazan": "喀山",
  "Sochi": "索契",

  // ---------- Major cities · Brazil ----------
  "São Paulo": "圣保罗",
  "Rio de Janeiro": "里约热内卢",
  "Salvador": "萨尔瓦多",
  "Fortaleza": "福塔莱萨",
  "Belo Horizonte": "贝洛奥里藏特",
  "Manaus": "马瑙斯",
  "Curitiba": "库里蒂巴",

  // ---------- Major cities · Germany ----------
  "Hamburg": "汉堡",
  "Munich": "慕尼黑",
  "Cologne": "科隆",
  "Frankfurt": "法兰克福",
  "Stuttgart": "斯图加特",
  "Düsseldorf": "杜塞尔多夫",

  // ---------- Major cities · United Kingdom ----------
  "Manchester": "曼彻斯特",
  "Birmingham": "伯明翰",
  "Liverpool": "利物浦",
  "Glasgow": "格拉斯哥",
  "Edinburgh": "爱丁堡",

  // ---------- Major cities · France ----------
  "Marseille": "马赛",
  "Lyon": "里昂",
  "Toulouse": "图卢兹",
  "Nice": "尼斯",
  "Bordeaux": "波尔多",

  // ---------- Major cities · Italy ----------
  "Milan": "米兰",
  "Naples": "那不勒斯",
  "Turin": "都灵",
  "Florence": "佛罗伦萨",
  "Venice": "威尼斯",

  // ---------- Major cities · Spain ----------
  "Barcelona": "巴塞罗那",
  "Valencia": "巴伦西亚",
  "Seville": "塞维利亚",
  "Bilbao": "毕尔巴鄂",
  "Málaga": "马拉加",

  // ---------- Major cities · Canada ----------
  "Toronto": "多伦多",
  "Vancouver": "温哥华",
  "Montreal": "蒙特利尔",
  "Calgary": "卡尔加里",
  "Edmonton": "埃德蒙顿",
  "Quebec City": "魁北克市",

  // ---------- Major cities · Australia / New Zealand ----------
  "Sydney": "悉尼",
  "Melbourne": "墨尔本",
  "Brisbane": "布里斯班",
  "Perth": "珀斯",
  "Adelaide": "阿德莱德",
  "Auckland": "奥克兰",

  // ---------- Major cities · Mexico ----------
  "Guadalajara": "瓜达拉哈拉",
  "Monterrey": "蒙特雷",
  "Cancún": "坎昆",
  "Tijuana": "蒂华纳",

  // ---------- Major cities · Argentina ----------
  "Córdoba": "科尔多瓦",
  "Rosario": "罗萨里奥",
  "Mendoza": "门多萨",

  // ---------- Major cities · South Korea ----------
  "Busan": "釜山",
  "Incheon": "仁川",
  "Daegu": "大邱",

  // ---------- Major cities · Indonesia ----------
  "Surabaya": "泗水",
  "Bandung": "万隆",
  "Medan": "棉兰",
  "Denpasar": "登巴萨",

  // ---------- Major cities · Turkey ----------
  "Istanbul": "伊斯坦布尔",
  "Izmir": "伊兹密尔",
  "Antalya": "安塔利亚",

  // ---------- Major cities · Saudi Arabia ----------
  "Jeddah": "吉达",
  "Mecca": "麦加",
  "Medina": "麦地那",

  // ---------- Major cities · United Arab Emirates ----------
  "Dubai": "迪拜",
  "Sharjah": "沙迦",

  // ---------- Major cities · Iran ----------
  "Mashhad": "马什哈德",
  "Isfahan": "伊斯法罕",
  "Shiraz": "设拉子",

  // ---------- Major cities · South Africa ----------
  "Cape Town": "开普敦",
  "Johannesburg": "约翰内斯堡",
  "Durban": "德班",

  // ---------- Major cities · Egypt ----------
  "Alexandria": "亚历山大",
  "Giza": "吉萨",

  // ---------- Major cities · Nigeria ----------
  "Lagos": "拉各斯",
  "Kano": "卡诺",

  // ---------- Major cities · Pakistan ----------
  "Karachi": "卡拉奇",
  "Lahore": "拉合尔",
  "Faisalabad": "费萨拉巴德",
  "Peshawar": "白沙瓦",

  // ---------- Major cities · Vietnam ----------
  "Ho Chi Minh City": "胡志明市",
  "Da Nang": "岘港",

  // ---------- Major cities · Thailand ----------
  "Chiang Mai": "清迈",
  "Phuket": "普吉",

  // ---------- Major cities · Philippines ----------
  "Cebu": "宿务",
  "Davao": "达沃",
  "Quezon City": "奎松城",

  // ---------- Major cities · Malaysia ----------
  "Penang": "槟城",
  "Johor Bahru": "新山",

  // ---------- Major cities · Israel ----------
  "Tel Aviv": "特拉维夫",
  "Haifa": "海法",

  // ---------- Major cities · Switzerland ----------
  "Zurich": "苏黎世",
  "Geneva": "日内瓦",
  "Basel": "巴塞尔",

  // ---------- Major cities · Netherlands ----------
  "Rotterdam": "鹿特丹",
  "The Hague": "海牙",

  // ---------- Major cities · Belgium ----------
  "Antwerp": "安特卫普",

  // ---------- Major cities · Sweden ----------
  "Gothenburg": "哥德堡",
  "Malmö": "马尔默",

  // ---------- Major cities · Poland ----------
  "Kraków": "克拉科夫",
  "Wrocław": "弗罗茨瓦夫",
  "Gdańsk": "格但斯克",

  // ---------- Major cities · Ukraine ----------
  "Kharkiv": "哈尔科夫",
  "Odesa": "敖德萨",
  "Lviv": "利沃夫",

  // ---------- Major cities · Portugal ----------
  "Porto": "波尔图",

  // ---------- Major cities · Greece ----------
  "Thessaloniki": "塞萨洛尼基",

  // ---------- Major cities · Austria ----------
  "Salzburg": "萨尔茨堡",
  "Innsbruck": "因斯布鲁克"
};
