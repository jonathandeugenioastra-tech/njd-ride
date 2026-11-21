/* NJ.D' RIDE – Panoramica del mercato ricambi e accessori custom.
   © 2026 dott. Jonathan D'Eugenio. Indice elaborato dall'autore sul mercato custom e sul catalogo pubblico
   Zodiac Bikers Book (n. 45, 1480 pagine, circa 43.000 articoli): marche e tipologie per categoria, con il rimando alla pagina del catalogo. */
const FB = 'https://flipbook.zodiac.nl/fr/bikersbook/?page=';
export const MARKET = [
  ['Selle', 31, 'Le Pera (Bare Bones, Silhouette, Villain, Stubs Cafe), Saddlemen, Burly (Cafe Tail), KickFlip, TailWhip, selle solo a molle, sissy bar removibili e docking kit', 'seat'],
  ['Scarichi', 65, 'Vance & Hines, Freedom Performance, 2 Bros, MCJ, Redthunder, Supertrapp, Cobra, RSD; 2-in-1, true dual, staggered, slip-on, terminali slash/fishtail, db-killer omologati, paracalore DEI', 'exhaust'],
  ['Luci ed elettrica', 163, 'Kellermann (Bullet, Atto, Micro), Motogadget, Highsider, Vision X, Cyron, frecce mini a manubrio, fanali LED, portatarga laterali, cablaggi e moduli CAN-bus', 'light'],
  ['Accensione e avviamento', 247, 'Dyna, Accel, Spyke, Twin Tec, Cycle Electric; motorini, statori, regolatori, cavi candele', 'engine'],
  ['Aspirazione', 315, 'S&S, K&N, Performance Machine, RSD, Mikuni, Power Commander, TFI; filtri aria, cornetti e mappature', 'air'],
  ['Motore', 399, "S&S, Wiseco, KB, Andrews, Jims; pistoni, cammes, punterie, kit d'aumento cilindrata", 'engine'],
  ['Primaria e frizione', 551, 'Barnett, BDL, Alto, Scorpion, Rivera Primo; primarie aperte a cinghia, frizioni rinforzate', 'engine'],
  ['Cambio', 627, 'Andrews, Jims, Baker; ingranaggi, selettori, cambi a 6 marce', 'engine'],
  ['Trasmissione finale', 729, 'Gates, Tsubaki, Andrews; pulegge, cinghie, conversioni a catena, offset', 'wheel'],
  ['Cerchi e gomme', 749, "Rick's, Performance Machine, Metzeler, Pirelli, Shinko, Avon, Firestone Deluxe Champion, fasce bianche; cerchi a raggi 16\"–21\", lenticolari, billet", 'wheel'],
  ['Freni', 801, 'Performance Machine, Beringer, Harrison, Brembo, Galfer, EBC, SBS; pinze 4 e 6 pistoncini, dischi wave e flottanti, tubi in treccia', 'brake'],
  ['Manubri, comandi e specchi', 873, 'Burly, Biltwell, Kustom Tech, Lowbrow, Performance Machine, Rizoma; ape hanger, drag, clip-on, riser, specchietti a fine manubrio', 'bars'],
  ['Cavi e tubi', 965, 'Barnett, Goodridge, Chromite; cavi frizione e gas maggiorati, tubi freno in treccia', 'bars'],
  ['Comandi a pedale', 999, 'Kustom Tech, Performance Machine, RSD, Pingel; comandi avanzati e arretrati, pedane, cambio elettrico', 'frame'],
  ['Sospensione anteriore', 1059, 'Hyperpro, Bitubo, Maselli, Performance Machine; springer, forcelle a balestra, steli rovesciati, kit di abbassamento, piastre', 'fork'],
  ['Telai e sospensioni posteriori', 1105, 'Progressive Suspension (412, 444, 490, 990), Bitubo, Hyperpro, Legend Air, Burly Slammer; forcelloni, rigid frame', 'shock'],
  ['Parafanghi', 1165, 'parafanghi in acciaio da 4,75" a 11", bobber, club style, Fat Bob, supporti e luci di coda', 'fender'],
  ['Serbatoi benzina e olio', 1193, 'serbatoi peanut, Fat Bob, Legacy, Laredo, tappi a filo, serbatoi olio custom, tubi Goodridge', 'tank'],
  ['Strumenti', 1243, 'Motogadget, Daytona, contachilometri e contagiri tondi e digitali, console serbatoio', 'light'],
  ['Parabrezza e cupolini', 1309, 'National Cycle (Switchblade, Heavy Duty, Spartan, Gladiator), Klock Werks, cupolini club style e quarter fairing', 'screen'],
  ['Borse', 1333, 'Texas Leather, K-Drive, Burly Voyager, Saddlemen; borse in cuoio, bauletti, borse da forcella e da sissy bar', 'bags']
];
export function marketHTML() {
  return MARKET.map(([n, p, t]) => `<div class="mk"><div><b>${n}</b><div class="note">${t}</div></div><a class="btn sm" href="${FB}${p}" target="_blank" rel="noopener">Catalogo p. ${p}</a></div>`).join('');
}
export function marketFor(kbType) { return MARKET.filter(m => m[3] === kbType); }
export const MARKET_URL = FB;
