/* NJ.D' RIDE – Banca dati tecnica d'officina.
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati (L. 633/1941).
   Badge: U = ufficiale (manuale della casa) · C = citazione fedele di manuale ufficiale · N = non verificato · X = non reperito da fonte ufficiale */

const SM13 = 'H-D Service Manual Dyna 2013 (99481-13A)';
const SM09 = 'H-D Service Manual Dyna 2009 (99481-09)';
const SM08 = 'H-D Service Manual Dyna 2008';
const SOFT18 = 'H-D Service Manual Softail 2018 (94000529)';

/* Dati comuni famiglia Dyna Twin Cam (2006-2017) – letti direttamente dai service manual ufficiali */
const DYNA = {
  fam: 'Harley-Davidson Dyna Twin Cam 96/103 (2006–2017)',
  nota: "Valori letti dai service manual ufficiali Harley-Davidson Dyna 2008, 2009 e 2013. Il modello 3D è un model year successivo (2016-2017, Twin Cam 103): la meccanica telaio è la stessa, ma prima di serrare controlla il manuale del tuo model year. H-D indica intervalli min–max: serra almeno al valore minimo.",
  sez: [
    ['Ruote e trasmissione finale', [
      ['Dado perno ruota anteriore (2013)', '84,1–90,9', '62–67 ft-lbs', 'U', SM13],
      ['Dado perno ruota anteriore (2008–2009)', '81,3–88,1', '60–65 ft-lbs', 'U', SM09],
      ['Fissaggio tappo perno anteriore (tutti tranne FLD)', '14,9–20,3', '132–180 in-lbs', 'U', SM13],
      ['Dado perno ruota posteriore', '128,8–142,4', '95–105 ft-lbs', 'U', SM13],
      ['Registro tendicinghia (dopo il serraggio del perno)', '13,6–16,3', '120–144 in-lbs', 'U', SM13],
      ['Viti corona/puleggia posteriore – 1° serraggio', '81,4', '60 ft-lbs', 'U', SM13],
      ['Viti corona/puleggia posteriore – finale', '104,5–112,6', '77–83 ft-lbs', 'U', SM13],
      ['Nipples raggi (ruote a raggi)', '6,2', '55 in-lbs', 'U', SM13],
      ['Dado perno forcellone (2013)', '95,0–104,5', '70–77 ft-lbs', 'U', SM13],
      ['Dado perno forcellone (2008–2009)', '96,3–101,7', '71–75 ft-lbs', 'U', SM09]]],
    ['Freni', [
      ['Viti fissaggio pinza anteriore (sup./inf.)', '38,0–51,5', '28–38 ft-lbs', 'U', SM13],
      ['Bullone ponte / perno pastiglie pinza anteriore', '20,3–22,6', '15–16 ft-lbs', 'U', SM13],
      ['Viti fissaggio pinza posteriore', '13,6–18,9', '120–168 in-lbs', 'U', SM13],
      ['Fissaggi pinza posteriore (servizio pastiglie)', '21,7–27,1', '16–20 ft-lbs', 'U', SM13],
      ['Perno pastiglie pinza posteriore', '9,0–13,6', '80–120 in-lbs', 'U', SM13],
      ['Viti disco anteriore (cerchio in lega o a raggi)', '21,7–32,5', '16–24 ft-lbs', 'U', SM13],
      ['Viti disco posteriore', '40,7–61,0', '30–45 ft-lbs', 'U', SM13],
      ['Banjo pinza / pompa anteriore e posteriore', '23,1–29,9', '17–22 ft-lbs', 'U', SM13],
      ['Valvola di spurgo pinze', '9,0–11,3', '80–100 in-lbs', 'U', SM13],
      ['Dado fissaggio pompa freno posteriore', '40,7–54,2', '30–40 ft-lbs', 'U', SM13],
      ['Morsetto pompa freno al manubrio', '6,8–9,0', '60–80 in-lbs', 'U', SM13],
      ['Liquido freni', 'DOT 4', 'sostituire ogni 2 anni', 'U', SM13]]],
    ['Forcella, sterzo e manubrio', [
      ['Bulloni morsetto piastre forcella (tutti tranne FLD)', '41–48', '30–35 ft-lbs', 'U', SM13],
      ['Dado cannotto di sterzo', '95–108,5', '70–80 ft-lbs', 'U', SM13],
      ['Tappi steli forcella (2013)', '30–80', '22–59 ft-lbs', 'U', SM13],
      ['Tappi steli forcella (2009)', '22–58', '16–43 ft-lbs', 'U', SM09],
      ['Vite cartuccia/tubo pompante forcella', '14,9–24,4', '132–216 in-lbs', 'U', SM13],
      ['Olio forcella FXDB / FXDC / FXDL – quantità e livello', '845 cc per stelo', 'livello 95 mm', 'U', SM13],
      ['Olio forcella FXDWG – quantità e livello', '869 cc per stelo', 'livello 95 mm', 'U', SM13],
      ['Olio forcella FXDF – quantità e livello', '784 cc per stelo', 'livello 120 mm', 'U', SM13],
      ['Tipo olio forcella', "H-D Type 'E'", 'revisione ogni 80.000 km', 'U', SM13],
      ['Bulloni riser manubrio', '40,7–54,2', '30–40 ft-lbs', 'U', SM13],
      ['Cavallotti superiori manubrio', '16,3–21,7', '12–16 ft-lbs', 'U', SM13],
      ['Viti blocchetti comandi', '4,0–5,1', '35–45 in-lbs', 'U', SM13]]],
    ['Sospensioni e telaio', [
      ['Ammortizzatori posteriori – fissaggio superiore', '40,7–54,2', '30–40 ft-lbs + Loctite 243', 'U', SM13],
      ['Ammortizzatori posteriori – fissaggio inferiore', '40,7–54,2', '30–40 ft-lbs + Loctite 243', 'U', SM13],
      ['Dado prigioniero interno ammortizzatore', '101,7–115,2', '75–85 ft-lbs', 'U', SM13],
      ['Dado flangiato supporto motore', '29,8–36,6', '22–27 ft-lbs', 'U', SM13],
      ['Bulloni isolatori anteriore/posteriore al telaio', '29,8–36,6', '22–27 ft-lbs', 'U', SM13],
      ['Staffe motore anteriori al motore', '34,0–43,3', '25–32 ft-lbs', 'U', SM13],
      ['Dadi parafango anteriore', '20,3–28,5', '15–21 ft-lbs', 'U', SM13],
      ['Viti parafango posteriore FXDB / FXDC / FXDL / FXDWG', '16,3–24,4', '12–18 ft-lbs', 'U', SM13],
      ['Viti supporti pedane (comandi centrali)', '40,7–54,2', '30–40 ft-lbs', 'U', SM13],
      ['Viti supporti pedane (comandi avanzati)', '43,4–50,2', '32–37 ft-lbs', 'U', SM13],
      ['Viti e dadi pedane', '9,5–12,2', '84–108 in-lbs', 'U', SM13],
      ['Viti supporto pedane passeggero', '33,9–47,4', '25–35 ft-lbs', 'U', SM13],
      ['Fissaggio posteriore sella', '2,3–4,5', '20–40 in-lbs', 'U', SM13]]],
    ['Motore, scarico e trasmissione primaria', [
      ['Candele (HD-6R12, distanza elettrodi 0,97–1,09 mm)', '16,3–24,4', '12–18 ft-lbs', 'U', SM13],
      ['Tappo scarico olio motore', '19,0–28,5', '14–21 ft-lbs', 'U', SM13],
      ['Tappo scarico primaria', '19,0–28,5', '14–21 ft-lbs', 'U', SM13],
      ['Tappo scarico cambio', '19,0–28,5', '14–21 ft-lbs', 'U', SM13],
      ['Astina/tappo carico cambio', '2,8–8,5', '25–75 in-lbs', 'U', SM13],
      ['Viti coperchio ispezione frizione', '9,5–12,2', '84–108 in-lbs', 'U', SM13],
      ['Viti coperchio primaria', '16,0–17,6', '12–13 ft-lbs', 'U', SM13],
      ['Dado mozzo frizione (albero primario)', '94,9–108,5', '70–80 ft-lbs', 'U', SM13],
      ['Bullone pignone compensatore – iniziale / finale', '135,6 / 190', '100 / 140 ft-lbs', 'U', SM13],
      ['Dadi flangia collettori scarico (inferiori)', '11,3–13,6', '100–120 in-lbs', 'U', SM13],
      ['Fascetta tubo di collegamento scarichi', '27,1–33,9', '20–25 ft-lbs', 'U', SM13],
      ['Bullone staffa scarico', '20,3–25,8', '15–19 ft-lbs', 'U', SM13],
      ['Viti coperchio bilancieri', '20,3–24,4', '15–18 ft-lbs', 'U', SM13],
      ['Bulloni testata: 1° / 2° serraggio / finale', '13,6–16,3 / 20,3–23,0', '120–144 in-lbs / 15–17 ft-lbs / +90°', 'U', SM13],
      ['Viti coperchio filtro aria', '4,1–6,8', '36–60 in-lbs + Loctite 243', 'U', SM13],
      ['Filtro olio', 'a mano', '½–¾ di giro dopo il contatto guarnizione', 'U', SM13]]],
    ['Fluidi e capacità', [
      ['Olio motore con filtro (serbatoio)', '2,8 L', '3,0 qt – H-D 360 20W50 o SYN3', 'U', SM13],
      ['Primaria', '0,95 L', '32 oz – Formula+', 'U', SM13],
      ['Cambio (al cambio olio versare prima 0,83 L)', '0,95 L', '32 oz – Formula+ o SYN3', 'U', SM13],
      ['Serbatoio benzina FXDB / FXDL / FXDWG', '17,8 L', '4,7 gal', 'U', SM13],
      ['Serbatoio benzina FXDC / FXDF', '18,9 L', '5,0 gal', 'U', SM13],
      ['Minimo motore', '950–1050 giri/min', '', 'U', SM13]]],
    ['Pneumatici (pressioni a freddo, con o senza passeggero)', [
      ['FXDB Street Bob / FXDC / FXDL – anteriore', 'Michelin Scorcher 31 100/90B19', '30 psi (2,07 bar)', 'U', SM13],
      ['FXDB Street Bob / FXDC / FXDL – posteriore', 'Michelin Scorcher 31 160/70B17', '40 psi (2,76 bar)', 'U', SM13],
      ['FXDWG Wide Glide – anteriore / posteriore', '80/90-21 · 180/60B17', '38 / 40 psi', 'U', SM13],
      ['FXDF Fat Bob – anteriore / posteriore', '130/90B16 · 180/70B16', '36 / 40 psi', 'U', SM13],
      ['FLD Switchback – anteriore / posteriore', '130/70B18 · 160/70B17', '36 / 40 psi', 'U', SM13],
      ['FXDLS Low Rider S 2016–17 – misure e pressioni', '—', 'non presenti nel manuale 2013', 'X', 'Consultare il manuale d\'uso del model year']]],
    ['Manutenzione', [
      ['Tagliandi', 'primo a 1.600 km, poi ogni 8.000 km', '', 'U', SM13],
      ['Liquido freni DOT 4', 'ogni 2 anni', '', 'U', SM13],
      ['Revisione forcella e cambio olio', 'ogni 80.000 km', '', 'U', SM13],
      ['Freccia cinghia (moto sul cavalletto, senza pilota)', '6,4–7,9 mm', 'con 4,5 kg al centro', 'U', SM13],
      ['Spessore minimo pastiglie', '1,02 mm', '', 'U', SM13],
      ['Gioco frizione alla leva', '1,6–3,2 mm', '', 'U', SM13]]]
  ]
};

const SOFTAIL = {
  fam: 'Harley-Davidson Softail Milwaukee-Eight (2018–)',
  nota: "Valori dal Service Manual Softail 2018 (94000529), riportato integralmente da fonte terza. Per i model year più recenti verifica sul service manual del tuo anno.",
  sez: [
    ['Ruote e freni', [
      ['Dado perno ruota posteriore', '128,8–142,4', '95–105 ft-lbs', 'C', SOFT18],
      ['Viti fissaggio pinza anteriore', '38–51,5', '28–38 ft-lbs', 'C', SOFT18],
      ['Bullone ponte pinza anteriore', '19,6–24,5', '14–18 ft-lbs', 'C', SOFT18],
      ['Perni pastiglie anteriori', '14,7–19,6', '11–14 ft-lbs', 'C', SOFT18],
      ['Viti disco anteriore', '22–33', '16–24 ft-lbs', 'C', SOFT18],
      ['Banjo pinza/pompa', '29–31', '21–23 ft-lbs', 'C', SOFT18],
      ['Banjo su modulo ABS', '23,1–25,8', '17–19 ft-lbs', 'C', SOFT18],
      ['Morsetti asse anteriore (inferiore / laterale)', '15–20 / 28–34', '', 'N', 'fonte terza che cita il 94000529']]],
    ['Forcella e telaio', [
      ['Bulloni morsetto piastre forcella e cannotto', '21,7–27,1', '16–20 ft-lbs', 'C', SOFT18],
      ['Tappo forcella standard', '30–80', '22–59 ft-lbs', 'C', SOFT18],
      ['Tappo forcella rovesciata sx / dx', '29–39 / 30–40', '', 'C', SOFT18],
      ['Staffe supporto pedane', '54,2–61', '40–45 ft-lbs', 'C', SOFT18],
      ['Viti parafango anteriore', '22–28', '16–21 ft-lbs', 'C', SOFT18],
      ['Ammortizzatore, manubrio/riser, scarichi, puleggia', '—', 'consultare il service manual', 'X', '—']]],
    ['Motore e fluidi', [
      ['Tappi scarico olio / primaria / cambio', '19–28,5', '14–21 ft-lbs', 'C', SOFT18],
      ['Candele (distanza 0,8–0,9 mm)', '10–15', '89–133 in-lbs', 'U', "Manuale d'uso Softail 2025 (94001246)"],
      ['Olio motore', '3,8 L al cambio', 'H-D 360 20W50 o SYN3', 'C', SOFT18],
      ['Cambio', '0,83 L', 'Formula+', 'C', SOFT18],
      ['Liquido freni', 'DOT 4', 'ogni 2 anni', 'C', SOFT18]]],
    ['Pneumatici', [
      ['FXBR Breakout – anteriore', 'Michelin Scorcher 11 130/60B21', '36 psi (2,48 bar)', 'C', SOFT18],
      ['FXBR Breakout – posteriore', 'Michelin Scorcher 11 240/40R18', '42 psi (2,90 bar)', 'C', SOFT18]]],
    ['Manutenzione', [
      ['Tagliandi', 'primo a 1.600 km, poi ogni 8.000 km', '', 'C', SOFT18],
      ['Candele', 'ogni 2 anni o 48.000 km', '', 'C', SOFT18],
      ['Freccia cinghia in servizio', '12,7–14,2 mm', 'con 4,5 kg', 'C', SOFT18]]]
  ]
};

const TOURING = {
  fam: 'Harley-Davidson Touring Milwaukee-Eight (2017–)',
  nota: "Per il Touring M8 il testo integrale del service manual non è pubblico: i dati sono parziali. Il dado del perno posteriore ha valori in conflitto tra le fonti: usa il service manual Touring del tuo anno.",
  sez: [
    ['Coppie', [
      ['Dado perno ruota anteriore', '95–102', '70–75 ft-lbs', 'C', 'manuale citato da forum H-D'],
      ['Dado perno ruota posteriore', '—', 'valori in conflitto (135–145 o 95–105 ft-lbs)', 'X', 'verificare sul service manual Touring'],
      ['Viti fissaggio pinza anteriore', '38–51,5', '28–38 ft-lbs', 'U', 'serviceinfo.harley-davidson.com'],
      ['Perni pastiglie anteriori', '20,3–22,6', '180–200 in-lbs', 'U', 'serviceinfo.harley-davidson.com'],
      ['Tappi scarico olio / primaria / cambio', '19–28,5', '14–21 ft-lbs', 'C', 'scheda tagliando FLHR 2020'],
      ['Viti coperchio frizione', '9,5–12,2', '84–108 in-lbs', 'C', 'scheda tagliando FLHR 2020'],
      ['Candele', '10–15', '89–133 in-lbs', 'C', 'manuale M8']]],
    ['Fluidi', [
      ['Olio motore Twin-Cooled con filtro', '4,7 L', 'primo riempimento 3,8 L', 'U', "Manuale d'uso 94000827"],
      ['Cambio', '0,95 L', 'al cambio olio 0,83 L', 'U', "Manuale d'uso 94000827"],
      ['Primaria', '1,0 L a secco', '', 'U', "Manuale d'uso 94000827"],
      ['Refrigerante (solo Twin-Cooled)', '0,8 L', '', 'U', "Manuale d'uso 94000827"],
      ['Olio forcella', 'poco più di 710 ml per stelo', "Type 'E', poi livello con attrezzo H-D", 'C', 'Service manual Touring 2017']]],
    ['Pneumatici e manutenzione', [
      ['Pressioni anteriore / posteriore', '36 / 40 psi', 'solo e con passeggero', 'N', 'riassunti dei manuali d\'uso'],
      ['Tagliandi', 'primo a 1.600 km, poi ogni 8.000 km', '', 'C', 'tabelle di manutenzione M8']]]
  ]
};

const INDIAN = {
  fam: 'Indian Chief / Scout Bobber',
  nota: "Dati dai manuali d'uso ufficiali Indian. Le coppie di pinze, dischi, piastre, ammortizzatori e manubrio sono solo nel service manual Indian, a pagamento.",
  sez: [
    ['Chief (Thunderstroke 2022–2025)', [
      ['Dado perno ruota posteriore – regolazione / finale', '20 / 88', '15 / 65 ft-lbs (chiave 27 mm)', 'U', 'Indian Chief Rider\'s Manual 2022'],
      ['Tappi scarico olio (2)', '20', '15 ft-lbs, rondelle nuove', 'U', 'Indian Chief Owner\'s Manual 2025'],
      ['Viti borse / supporto inferiore borse', '18 / 25', '13 / 18 ft-lbs', 'U', 'Indian Chief Owner\'s Manual 2025'],
      ['Olio motore con filtro', '5,7 L', 'al cambio versare 4,25 L poi rabboccare', 'U', 'Indian Chief Owner\'s Manual 2025'],
      ['Olio forcella', '555 cc per stelo', '', 'U', 'Indian Chief Owner\'s Manual 2025'],
      ['Liquido freni', 'DOT 4', 'ogni 2 anni', 'U', 'Indian Chief Owner\'s Manual 2025'],
      ['Pneumatici Chief – anteriore', '130/60B19', '36 psi (2,48 bar)', 'U', 'Indian Chief Rider\'s Manual 2022'],
      ['Pneumatici Chief – posteriore', '180/65B16', '40 psi (2,76 bar)', 'U', 'Indian Chief Rider\'s Manual 2022'],
      ['Chief Bobber – anteriore / posteriore', '130/90B19 · 180/65B16', '', 'U', 'Indian Chief Rider\'s Manual 2022'],
      ['Tagliandi', 'primo a 800 km, poi ogni 8.000 km', 'cinghia e candele a 48.000 km', 'U', 'Indian Chief Owner\'s Manual 2025']]],
    ['Scout Bobber 2022', [
      ['Dado perno ruota posteriore', '88', '65 ft-lbs', 'U', 'Indian Scout Bobber Owner\'s Manual 2022'],
      ['Pneumatici anteriore / posteriore', '130/90B16 · 150/80B16', '36 / 40 psi', 'U', 'Indian Scout Bobber Owner\'s Manual 2022']]]
  ]
};

const GUZZI = {
  fam: 'Moto Guzzi (V7 / V85 TT – riferimento per la 850 Le Mans storica)',
  nota: "Per la 850 Le Mans storica non è disponibile un manuale ufficiale pubblico: sotto trovi le coppie generiche Guzzi e i dati delle V7/V85 TT dai manuali d'officina Moto Guzzi.",
  sez: [
    ['Coppie generiche Moto Guzzi (se manca il valore specifico)', [
      ['M5 / M6 / M8', '6 / 10 / 25', '', 'C', 'Manuale stazione di servizio Moto Guzzi'],
      ['M10 / M12', '50 / 80', '', 'C', 'Manuale stazione di servizio Moto Guzzi']]],
    ['V7 750 (2012)', [
      ['Viti steli su piastre (M10x40)', '50', '', 'C', 'Manuale officina V7 B043094'],
      ['Ghiera cannotto (M25x1)', '7', '', 'C', 'Manuale officina V7 B043094'],
      ['Viti laterali parafango post. (M8) / viti parafango (M6)', '25 / 10', '', 'C', 'Manuale officina V7 B043094'],
      ['Pneumatici', '100/90-18 · 130/80-17', '2,5 bar solo, 2,6 bar con passeggero', 'C', 'Manuale officina V7 B043094'],
      ['Olio motore con filtro / cambio / coppia conica', '2,0 L / 1,0 L / 170 cc', 'cambio SAE 85W-90 GL-5', 'C', 'Manuale officina V7 B043094']]],
    ['V85 TT', [
      ['Pressioni anteriore / posteriore', '2,5 / 2,8 bar', '', 'C', 'Manuale officina V85 TT 2Q000400'],
      ['Olio motore con filtro', '1,76 L', '10W-60', 'C', 'Manuale officina V85 TT 2Q000400'],
      ['Coppia conica', '180 cc', '', 'C', 'Manuale officina V85 TT 2Q000400'],
      ['Tagliandi', 'primo a 1.500 km, poi ogni 10.000 km', '', 'C', 'Manuale officina V85 TT 2Q000400']]],
    ['850 Le Mans storica', [
      ['Coppie specifiche, fluidi, pneumatici', '—', 'consultare il manuale d\'officina d\'epoca', 'X', '—']]]
  ]
};

const DUCATI = {
  fam: 'Ducati Panigale V4 (2018–2024)',
  nota: "Il libretto d'uso Ducati non contiene coppie di serraggio: le coppie del telaio sono nel manuale d'officina, riservato alla rete Ducati.",
  sez: [
    ['Dati', [
      ['Dado ruota posteriore (monobraccio)', '230 ±5%', 'con grasso Shell Retinax HDX2', 'C', 'manuale citato da forum Ducati'],
      ['Pneumatici', '120/70 ZR17 · 200/60 ZR17', 'Pirelli Diablo Supercorsa SP', 'U', 'ducati.com'],
      ['Pressioni strada (solo pilota)', '2,3 / 2,1 bar', 'pista 2,3 / 1,8 bar', 'C', 'Manuale d\'uso Panigale V4 R'],
      ['Olio motore', 'coppa + filtro 3,8 L', 'SAE 15W-50 JASO MA2', 'C', 'Manuale d\'uso Panigale V4 (altra edizione: 3,4 L)'],
      ['Oil Service / Desmo Service', 'ogni 12.000 / 24.000 km', '', 'U', 'Ducati Transparent Maintenance 2024'],
      ['Liquido freni e frizione', 'ogni 24 mesi', '', 'U', 'Ducati Transparent Maintenance 2024'],
      ['Pinze, dischi, piastre, ammortizzatore, semimanubri, scarico', '—', 'manuale d\'officina Ducati', 'X', '—']]]
  ]
};

export const TECH = { lowrider: DYNA, streetbob: DYNA, breakout: SOFTAIL, roadking: TOURING, electra: TOURING, indian: INDIAN, guzzi: GUZZI, panigale: DUCATI };
export const FAMIGLIE = { 'Dyna Twin Cam': DYNA, 'Softail M8': SOFTAIL, 'Touring M8': TOURING, 'Indian': INDIAN };

export const MANUALI_UFF = [
  ['Harley-Davidson – manuali d\'uso (gratuiti, anche in italiano)', 'https://serviceinfo.harley-davidson.com'],
  ['Indian Chief 2025 – Owner\'s Manual (PDF)', 'https://cdn.polarisportal.com/servicemanagement-public/OwnerManuals/IND/9941580r04_web.pdf'],
  ['Indian Chief 2022 – Rider\'s Manual', 'https://publications.polaris.com/owner/owners-manuals/0000700397.xml?onepage=true'],
  ['Ducati – libretti uso e manutenzione', 'https://www.ducati.com/ww/en/service-maintenance/manuals-genuine-parts-and-maintenance-schedules'],
  ['Moto Guzzi – manuali d\'uso', 'https://manuals.motoguzzi.com']
];

const BADGE = { U: ['uff', 'Ufficiale'], C: ['cit', 'Da manuale ufficiale'], N: ['nv', 'Non verificato'], X: ['nr', 'Consultare il service manual'] };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function techHTML(d, filtro) {
  if (!d) return '<div class="note">Nessun dato per questo modello.</div>';
  const re = filtro ? new RegExp(filtro, 'i') : null;
  let h = `<div class="tfam">${esc(d.fam)}</div><div class="note">${esc(d.nota)}</div>`;
  for (const [tit, righe] of d.sez) {
    const rr = re ? righe.filter(r => re.test(r[0])) : righe; if (!rr.length) continue;
    h += `<div class="tsez">${esc(tit)}</div><table class="ttab">` + rr.map(r => {
      const b = BADGE[r[3]] || BADGE.N;
      return `<tr><th>${esc(r[0])}</th><td><b>${esc(r[1])}</b>${r[1] && /^[\d,./ ±–%-]+$/.test(r[1]) && r[1] !== '—' ? ' Nm' : ''}${r[2] ? `<div class="sub2">${esc(r[2])}</div>` : ''}<div class="src"><span class="bdg ${b[0]}">${b[1]}</span> ${esc(r[4])}</div></td></tr>`;
    }).join('') + '</table>';
  }
  return h;
}

/* Filtri per collegare il consulente meccanico alle coppie ufficiali */
export const KB2TORQ = {
  shock: 'ammortizz|isolator', fork: 'forcella|stel|piastre|cannotto|tappi', fender: 'parafango', screen: 'parabrezza', bags: 'borse',
  exhaust: 'scarico|collettor|staffa scarico', bars: 'manubrio|riser|cavallott|comandi|pompa freno al', mirror: 'manubrio|riser',
  wheel: 'perno ruota|corona|raggi|disco|tappo perno', tire: 'pneumatic|anteriore|posteriore', brake: 'pinza|disco|banjo|spurgo|freni|pastiglie',
  seat: 'sella', sissy: 'parafango|sella', engine: 'candel|testata|bilancieri|scarico olio|coperchio', air: 'filtro aria', tank: 'benzina', frame: 'pedane|supporto motore|forcellone|isolator'
};
