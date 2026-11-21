/* NJ.D' RIDE – Libreria ricambi 3D reali (modelli di modellatori professionisti, licenza CC BY 4.0).
   © 2026 dott. Jonathan D'Eugenio – selezione, pulizia, ottimizzazione e messa in scala alle misure reali. */
const SF = 'https://sketchfab.com/3d-models/';
const BRK = ['Dakta.Grower.Nzl', SF + 'harley-davidson-1745-softail-breakout-fxbr-2018-d95b21e651d24d6fb196c6e5cb971faf'];
/* [id, nome, categoria, tipo consulente, autore, url, nota misura] */
export const PARTS = [
  ['forcella_springer', 'Forcella springer', 'Forcelle', 'fork', 'kowbassen', SF + 'springer-forks-ff695029ecff4ad494d373f612c8cdf7', 'lunghezza 820 mm'],
  ['forcella_custom', 'Forcella custom a steli lunghi', 'Forcelle', 'fork', 'Scotty.Eddy', SF + 'motorcycle-forks-custom-7c5608e1a29a41f09557ba8f3235597d', 'lunghezza 850 mm'],
  ['ammortizzatore', 'Ammortizzatore a molla con serbatoio', 'Sospensioni', 'shock', 'giovax1', SF + 'rear-shock-absorber-motorbike-a68d0cd06e4b4010ad7136a4d8fb9103', 'interasse 340 mm (13")'],
  ['sella_corbin', 'Sella solo trapuntata (scansione Corbin)', 'Selle', 'seat', 'Corbin Seats', SF + 'indian-scout-motorcycle-solo-saddle-50bad064701c4433ac994e1adafdc446', 'lunghezza 500 mm'],
  ['sella_breakout', 'Sella biposto Breakout', 'Selle', 'seat', BRK[0], BRK[1], 'misura reale'],
  ['serbatoio_breakout', 'Serbatoio Fat Bob (Breakout)', 'Serbatoi', 'tank', BRK[0], BRK[1], 'misura reale'],
  ['serbatoio_cafe', 'Serbatoio cafe racer con grafica', 'Serbatoi', 'tank', '3d.caster', SF + 'bad-to-the-bone-cafe-racer-tank-ff2f17b56f5449a79d83e20e22376db6', 'lunghezza 600 mm'],
  ['serbatoio_scan', 'Serbatoio vintage (scansione 3D reale)', 'Serbatoi', 'tank', 'GoMeasure3D', SF + 'motorcycle-fuel-tank-artec-eva-3d-scan-f2eb49c0f5b34ab499b587b562437515', 'lunghezza 580 mm'],
  ['serbatoio_olio', 'Serbatoio olio (scansione, grezzo)', 'Serbatoi', 'tank', 'Thunk3D', SF + 'motorcycle-oil-tank-shell-3c7dd1e933c447c685737f274d93fc02', 'lunghezza 320 mm'],
  ['scarico_harley', 'Collettori 2 in 1 Harley', 'Scarichi', 'exhaust', 'apostolm', SF + 'harley-davidson-exhaust-high-poly-c00e87a8a6b44db8973daae8702eec43', 'lunghezza 1550 mm'],
  ['scarico_shotgun', 'Scarico shotgun Breakout', 'Scarichi', 'exhaust', BRK[0], BRK[1], 'misura reale'],
  ['scarico_sc_project', 'Silenziatore racing in carbonio', 'Scarichi', 'exhaust', 'blakebella', SF + 'sc-project-cr-t-exhaust-0771c00e2b684b48aab1194986d0e4e6', 'lunghezza 450 mm'],
  ['ruota_ant_21', 'Ruota anteriore 21" Breakout', 'Ruote', 'wheel', BRK[0], BRK[1], 'misura reale'],
  ['ruota_post_240', 'Ruota posteriore 18" con gomma 240', 'Ruote', 'wheel', BRK[0], BRK[1], 'misura reale'],
  ['ruota_lega', 'Ruota in lega sportiva con disco', 'Ruote', 'wheel', 'Burak Gök', SF + 'motorcycle-tire-rim-360ab8a95fb54111838f4d7bc6a8e4b8', 'Ø 640 mm'],
  ['ruota_raggi', 'Cerchio a raggi cromato con mozzo', 'Ruote', 'wheel', 'tbob', SF + 'wire-wheel-metallic-ee938014a3094e199f2f866a77395c44', 'Ø 640 mm'],
  ['pinza_brembo', 'Pinza freno radiale racing', 'Freni', 'brake', 'st.Angelo', SF + 'brembo-brake-caliper-c2fc98f21b50402faf28fb30fc7c0696', 'lunghezza 170 mm'],
  ['pinza_moto', 'Pinza freno flottante', 'Freni', 'brake', 'Janovich', SF + 'motorcycle-brake-caliper-deb95dda313244a8a2cd057ce221f61b', 'lunghezza 160 mm'],
  ['faro_vintage', 'Faro vintage a campana 7"', 'Luci', 'headlight', 'geovaniduran1', SF + 'vintage-headlight-f4cf99d91c474a5daa0e4668be23a33b', 'Ø 7"'],
  ['faro_breakout', 'Faro 5¾" Breakout', 'Luci', 'headlight', BRK[0], BRK[1], 'misura reale'],
  ['frecce_stop_breakout', 'Frecce e stop posteriori su supporti', 'Luci', 'indicator', BRK[0], BRK[1], 'misura reale'],
  ['specchio_sx', 'Specchietto sinistro con leva e blocchetto', 'Specchietti', 'mirror', BRK[0], BRK[1], 'misura reale'],
  ['specchio_dx', 'Specchietto destro con leva e blocchetto', 'Specchietti', 'mirror', BRK[0], BRK[1], 'misura reale'],
  ['targa', 'Portatarga con luce targa', 'Portatarga', 'light', BRK[0], BRK[1], 'misura reale'],
  ['pedane_avanzate', 'Comandi avanzati con pedane', 'Comandi', 'frame', BRK[0], BRK[1], 'misura reale'],
  ['parafango_ant', 'Parafango anteriore', 'Parafanghi', 'fender', 'syt75372', SF + 'white-motorcycle-front-fender-ec65666c823d447cb17a4d604f8035f7', 'lunghezza 550 mm'],
  ['carena_club', 'Carena club style (quarter fairing) con plexi', 'Carene', 'fairing', 'everhard', SF + 'harley-davidson-fxdls-dyna-low-rider-s-custom-d5f6a5b5d96145bb94591223439a53cd', 'larghezza 580 mm · fissaggio forcella'],
  ['carena_batwing', 'Carena batwing con parabrezza e carenatura interna', 'Carene', 'fairing', 'everhard', SF + 'harley-davidson-flhtp-electra-glide-police-la-417dadb8e40a48fd9386ec22a412d964', 'larghezza 980 mm · fissaggio forcella'],
  ['spoiler_chin', 'Spoiler inferiore con rete (chin spoiler)', 'Carene', 'fairing', 'LongJohnHD', SF + 'harley-chin-spoiler-for-touring-models-3fc9f06b1e8047b3be5e53eec799c16c', 'altezza 430 mm'],
  ['sella_codino_cafe', 'Sella café tuck & roll con codino a gobba', 'Selle', 'seat', 'l o u i s', SF + 'triumph-bonneville-cafe-racer-85c43bc85b654e95b69cbb96738a1cd6', 'lunghezza 745 mm'],
  ['serbatoio_cafe_classico', 'Serbatoio café racer con tappo', 'Serbatoi', 'tank', 'l o u i s', SF + 'triumph-bonneville-cafe-racer-85c43bc85b654e95b69cbb96738a1cd6', 'lunghezza 550 mm'],
  ['semimanubri_cafe', 'Semimanubri café con leve e blocchetti', 'Manubri', 'bars', 'l o u i s', SF + 'triumph-bonneville-cafe-racer-85c43bc85b654e95b69cbb96738a1cd6', 'larghezza 700 mm'],
  ['parafango_ant_cafe', 'Parafango anteriore café corto', 'Parafanghi', 'fender', 'l o u i s', SF + 'triumph-bonneville-cafe-racer-85c43bc85b654e95b69cbb96738a1cd6', 'lunghezza 490 mm'],
  ['paramotore_touring', 'Paramotore touring cromato', 'Telaio', 'frame', 'everhard', SF + 'harley-davidson-flhtp-electra-glide-police-la-417dadb8e40a48fd9386ec22a412d964', 'larghezza 760 mm']
];
export const PART_CATS = [...new Set(PARTS.map(p => p[2]))];
