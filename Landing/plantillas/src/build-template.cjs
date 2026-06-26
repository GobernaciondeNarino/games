const fs = require('fs');
const path = require('path');
const SRC = __dirname;                                // plantillas/src
const ROOT = path.resolve(__dirname, '..', '..');     // Landing/
const DATA = path.join(ROOT, 'assets', 'data');
const OUT = path.resolve(__dirname, '..', 'plantilla-tic-landing.json');
const MEDIA = 'https://tic.narino.gov.co/wp-content/uploads/2026/06'; // donde subirán los media

// ---------- ids ----------
let _c = 0x1000;
function id() { _c += 7; return (Math.abs(Math.sin(_c) * 16777215) | 0).toString(16).padStart(7, '0').slice(-7); }

// ---------- primitivas ----------
const px = (n) => ({ unit: 'px', size: n, sizes: [] });
const em = (n) => ({ unit: 'em', size: n, sizes: [] });
const gap = (n) => ({ unit: 'px', size: n, column: String(n), row: String(n), isLinked: true, sizes: [] });
function container(settings, elements) {
  return { id: id(), elType: 'container', settings, elements: elements || [], isInner: false, isLocked: false,
    defaultEditSettings: { defaultEditRoute: 'content' }, editSettings: { defaultEditRoute: 'content' }, interactions: [] };
}
function widget(widgetType, settings) {
  return { id: id(), elType: 'widget', widgetType, settings, elements: [], isInner: false, isLocked: false,
    defaultEditSettings: { defaultEditRoute: 'content' }, editSettings: { defaultEditRoute: 'content' }, interactions: [] };
}

// ---------- widgets ----------
function heading(title, o = {}) {
  const s = { title, header_size: o.size || 'h2', align: o.align || 'left',
    title_color: o.color || '#0A2540', typography_typography: 'custom',
    typography_font_family: 'Hind Madurai', typography_font_weight: o.weight || '700' };
  if (o.fs) s.typography_font_size = px(o.fs);
  if (o.fsm) s.typography_font_size_mobile = px(o.fsm);
  if (o.ls) s.typography_letter_spacing = px(o.ls);
  return widget('heading', s);
}
function text(html, o = {}) {
  return widget('text-editor', { editor: html, align: o.align || 'left', text_color: o.color || '#2A2F36',
    typography_typography: 'custom', typography_font_family: 'Hind Madurai',
    typography_font_size: px(o.fs || 16), typography_line_height: em(1.6) });
}
function kicker(label, color) {
  return widget('html', { html: `<div style="font-family:'Share Tech Mono',ui-monospace,monospace;letter-spacing:.25em;font-size:12px;color:${color || '#0059B3'};margin-bottom:6px">// ${label}</div>` });
}
function iconBox(icon, title, desc, o = {}) {
  return widget('icon-box', {
    selected_icon: { value: icon, library: icon.indexOf('fab') === 0 ? 'fa-brands' : 'fa-solid' },
    title_text: title, description_text: desc, position: o.position || 'top',
    primary_color: o.icon || '#0066CC', title_color: o.titleColor || '#0A2540', description_color: o.descColor || '#2A2F36',
    icon_size: px(o.iconSize || 32), icon_space: px(14),
    title_typography_typography: 'custom', title_typography_font_family: 'Hind Madurai', title_typography_font_weight: '700', title_typography_font_size: px(19),
    description_typography_typography: 'custom', description_typography_font_family: 'Hind Madurai', description_typography_font_size: px(15),
    text_align: o.align || 'left',
  });
}
function button(txt, url, o = {}) {
  return widget('button', { text: txt, link: { url, is_external: o.ext ? 'on' : '', nofollow: '' },
    align: o.align || 'left', background_color: o.bg || '#0066CC', button_text_color: o.color || '#ffffff',
    hover_color: '#ffffff', button_background_hover_color: '#00A8FF',
    border_radius: { unit: 'px', top: '2', right: '2', bottom: '2', left: '2', isLinked: true },
    text_padding: { unit: 'px', top: '14', right: '28', bottom: '14', left: '28', isLinked: false },
    typography_typography: 'custom', typography_font_family: 'Nunito Sans', typography_font_weight: '700', typography_font_size: px(15) });
}
function image(url, o = {}) {
  const s = { image: { url, id: '', alt: o.alt || '', source: 'library' }, image_size: 'full', align: o.align || 'center' };
  if (o.w) s.width = { unit: '%', size: o.w, sizes: [] };
  if (o.radius) s.image_border_radius = { unit: 'px', top: '4', right: '4', bottom: '4', left: '4', isLinked: true };
  return widget('image', s);
}
function spacer(n) { return widget('spacer', { space: px(n) }); }
function rawhtml(h) { return widget('html', { html: h }); }
function fx(preset, o = {}) {
  const h = o.h || 360, color = o.color || '#00A8FF';
  const style = `width:100%;height:${h}px;min-height:${h}px;position:relative;overflow:hidden;border:1px solid rgba(0,168,255,.35);background:${o.bg || '#F3F6F8'};clip-path:polygon(0 16px,16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)`;
  const dp = o.poster ? ` data-poster="${o.poster}"` : '';
  return rawhtml(`<div class="tic-fx" data-fx="${preset}" data-color="${color}"${dp} style="${style}" aria-hidden="true"></div>`);
}

// ---------- contenedores de layout ----------
function sec(o, inner) {
  const s = { content_width: 'full', flex_direction: 'column', flex_align_items: 'center', flex_justify_content: 'center',
    padding: { unit: 'px', top: String(o.padY != null ? o.padY : 76), right: '16', bottom: String(o.padY != null ? o.padY : 76), left: '16', isLinked: false } };
  if (o.bg) { s.background_background = 'classic'; s.background_color = o.bg; }
  if (o.bgImage) { s.background_background = 'classic'; s.background_image = { url: o.bgImage, id: '', alt: '', source: 'library' }; s.background_position = 'center center'; s.background_size = 'cover'; }
  if (o.minh) s.min_height = { unit: 'vh', size: o.minh, sizes: [] };
  return container(s, Array.isArray(inner) ? inner : [inner]);
}
function boxed(elements, o = {}) {
  return container({ content_width: 'boxed', flex_direction: o.dir || 'column',
    flex_align_items: o.alignI || 'center', flex_justify_content: o.justify || 'flex-start',
    flex_gap: gap(o.gap != null ? o.gap : 18), width: { unit: '%', size: 100, sizes: [] } }, elements);
}
function row(elements, o = {}) {
  return container({ content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'column', flex_wrap: o.wrap || 'wrap',
    flex_align_items: o.alignI || 'stretch', flex_justify_content: o.justify || 'center',
    flex_gap: gap(o.gap != null ? o.gap : 22), width: { unit: '%', size: 100, sizes: [] } }, elements);
}
function colb(elements, basis, o = {}) {
  const s = { content_width: 'full', flex_direction: 'column', flex_align_items: o.alignI || 'flex-start',
    flex_justify_content: o.justify || 'flex-start', flex_gap: gap(o.gap != null ? o.gap : 14),
    width: { unit: '%', size: basis || 100, sizes: [] }, width_mobile: { unit: '%', size: 100, sizes: [] } };
  if (o.bg) { s.background_background = 'classic'; s.background_color = o.bg; }
  if (o.pad) s.padding = { unit: 'px', top: String(o.pad), right: String(o.pad), bottom: String(o.pad), left: String(o.pad), isLinked: true };
  if (o.border) { s.border_border = 'solid'; s.border_width = { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', isLinked: true }; s.border_color = o.border; }
  return container(s, elements);
}

// ---------- hero + motor FX (archivos plantilla) ----------
let hero = fs.readFileSync(path.join(SRC, 'hero-embed.template.html'), 'utf8');
// Tipografías institucionales (una sola carga para toda la página).
hero = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hind+Madurai:wght@300;400;500;600;700&family=Nunito+Sans:wght@600;700&family=Share+Tech+Mono&display=swap">\n' + hero;
const muni = JSON.parse(fs.readFileSync(`${DATA}/narino-municipios.geojson`, 'utf8'));
const outline = JSON.parse(fs.readFileSync(`${DATA}/narino-outline.json`, 'utf8'));
hero = hero.replace('__MUNI__', JSON.stringify(muni)).replace('__OUTLINE__', JSON.stringify(outline));
const fxEngine = fs.readFileSync(path.join(SRC, 'fx-engine.template.html'), 'utf8');

// ====================== SECCIONES ======================
const content = [];

// 1) HERO (globo 3D)
content.push(sec({ padY: 0 }, boxed([rawhtml(hero)], { gap: 0 })));

// 2) Motor FX (script invisible que monta todos los .tic-fx)
content.push(container({ content_width: 'full', padding: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', isLinked: true }, min_height: px(0) }, [rawhtml(fxEngine)]));

// 3) CIFRAS CLAVE (panel oscuro + contadores neón)
function counter(end, suffix, title) {
  return widget('counter', { starting_number: 0, ending_number: end, suffix, title, thousand_separator: 'yes',
    number_color: '#21D4FF', title_color: '#E7EBEE',
    typography_number_typography: 'custom',
    number_typography_typography: 'custom', number_typography_font_family: 'Hind Madurai', number_typography_font_weight: '700', number_typography_font_size: px(46),
    title_typography_typography: 'custom', title_typography_font_family: 'Nunito Sans', title_typography_font_weight: '700', title_typography_font_size: px(15) });
}
content.push(sec({ bg: '#0A2540', padY: 54 }, boxed([
  row([
    colb([counter(64, '', 'Municipios')], 24, { alignI: 'center' }),
    colb([counter(120, '+', 'Conjuntos de datos abiertos')], 24, { alignI: 'center' }),
    colb([counter(1500, '+', 'Trámites y servicios en línea')], 24, { alignI: 'center' }),
    colb([counter(98, '%', 'Cobertura de conectividad')], 24, { alignI: 'center' }),
  ], { gap: 18 }),
])));

// 4) SOBRE LA SECRETARÍA (texto + FX rings)
content.push(sec({ bg: '#E7EBEE' }, boxed([
  row([
    colb([
      kicker('QUIÉNES SOMOS'),
      heading('Tecnología y datos al servicio de lo público', { fs: 34 }),
      text('<p>La <strong>Secretaría TIC, Innovación y Gobierno Abierto</strong> lidera la transformación digital de la Gobernación de Nariño: moderniza la gestión, abre los datos del departamento y acerca el Estado a la ciudadanía de los 64 municipios con tecnología, analítica e inteligencia artificial.</p>'),
      button('Conoce la Secretaría', 'https://tic.narino.gov.co/'),
    ], 54, { gap: 16 }),
    colb([fx('rings', { h: 340, color: '#0066CC' })], 42, { alignI: 'stretch' }),
  ], { alignI: 'center', gap: 30 }),
])));

// 5) LÍNEAS ESTRATÉGICAS (4 icon-box)
content.push(sec({ bg: '#F3F6F8' }, boxed([
  kicker('LÍNEAS ESTRATÉGICAS', '#0059B3'),
  heading('Cuatro frentes para un gobierno abierto e inteligente', { align: 'center', fs: 32 }),
  spacer(8),
  row([
    colb([iconBox('fas fa-scale-balanced', 'Gobierno Abierto', 'Transparencia, participación y rendición de cuentas hacia la ciudadanía.', { align: 'center', position: 'top' })], 23, { alignI: 'center', bg: '#FFFFFF', pad: 22, border: '#CBD3DA' }),
    colb([iconBox('fas fa-chart-line', 'Datos y Analítica', 'Datos abiertos y analítica para decidir con evidencia en el territorio.', { align: 'center' })], 23, { alignI: 'center', bg: '#FFFFFF', pad: 22, border: '#CBD3DA' }),
    colb([iconBox('fas fa-lightbulb', 'Innovación Pública', 'Laboratorio de innovación e inteligencia artificial para el sector público.', { align: 'center' })], 23, { alignI: 'center', bg: '#FFFFFF', pad: 22, border: '#CBD3DA' }),
    colb([iconBox('fas fa-network-wired', 'Conectividad', 'Infraestructura y conectividad para cerrar la brecha digital territorial.', { align: 'center' })], 23, { alignI: 'center', bg: '#FFFFFF', pad: 22, border: '#CBD3DA' }),
  ], { gap: 18, alignI: 'stretch' }),
])));

// 6) INNOVACIÓN & IA (FX network + texto)
content.push(sec({ bg: '#E7EBEE' }, boxed([
  row([
    colb([fx('network', { h: 360, color: '#00A8FF', poster: `${MEDIA}/hero-plate-hud-frame.jpg` })], 50, { alignI: 'stretch' }),
    colb([
      kicker('INNOVACIÓN + IA'),
      heading('Inteligencia artificial para decisiones públicas', { fs: 32 }),
      text('<p>Aplicamos analítica avanzada e inteligencia artificial para anticipar necesidades, optimizar servicios y focalizar la inversión pública. Prototipamos soluciones con datos del departamento en un laboratorio de innovación abierto.</p>'),
      button('Explora la innovación', 'https://tic.narino.gov.co/innovacion/'),
    ], 46, { gap: 16, justify: 'center' }),
  ], { alignI: 'center', gap: 30 }),
])));

// 7) DATOS ABIERTOS (texto + FX particles)
content.push(sec({ bg: '#F3F6F8' }, boxed([
  row([
    colb([
      kicker('DATOS ABIERTOS', '#0059B3'),
      heading('Datos abiertos para toda la ciudadanía', { fs: 32 }),
      text('<p>Publicamos los conjuntos de datos del departamento en formatos reutilizables para que ciudadanía, academia y sector productivo creen valor. Consulta, descarga y construye sobre la información pública de Nariño.</p>'),
      button('Explora los datos abiertos', 'https://datos.narino.gov.co/'),
    ], 46, { gap: 16, justify: 'center' }),
    colb([fx('particles', { h: 360, color: '#0066CC', poster: `${MEDIA}/hero-plate-hud-frame.jpg` })], 50, { alignI: 'stretch' }),
  ], { alignI: 'center', gap: 30 }),
])));

// 8) CONECTIVIDAD (texto + FX terrain)
content.push(sec({ bg: '#E7EBEE' }, boxed([
  row([
    colb([fx('terrain', { h: 360, color: '#00A8FF', poster: `${MEDIA}/hero-plate-hud-frame.jpg` })], 52, { alignI: 'stretch' }),
    colb([
      kicker('CONECTIVIDAD'),
      heading('Conectividad para los 64 municipios', { fs: 32 }),
      text('<p>Llevamos infraestructura, conectividad y capacidades digitales a todo el territorio —de la costa Pacífica a la cordillera andina— para cerrar la brecha digital y garantizar derechos en lo urbano y lo rural.</p>'),
      button('Programas de conectividad', 'https://tic.narino.gov.co/'),
    ], 44, { gap: 16, justify: 'center' }),
  ], { alignI: 'center', gap: 30 }),
])));

// 9) TRÁMITES Y SERVICIOS (3 tarjetas)
content.push(sec({ bg: '#F3F6F8' }, boxed([
  kicker('TRÁMITES Y SERVICIOS', '#0059B3'),
  heading('Trámites y servicios en línea', { align: 'center', fs: 32 }),
  spacer(8),
  row([
    colb([iconBox('fas fa-id-card', 'Rentas y pagos', 'Liquida y paga impuestos departamentales en línea, sin filas.', { align: 'left' }), button('Ir al servicio', 'https://www.gov.co/', { align: 'left' })], 31, { bg: '#FFFFFF', pad: 24, border: '#CBD3DA', gap: 14 }),
    colb([iconBox('fas fa-comments', 'PQRSD', 'Radica peticiones, quejas, reclamos, sugerencias y denuncias.', { align: 'left' }), button('Radicar PQRSD', 'https://www.gov.co/', { align: 'left' })], 31, { bg: '#FFFFFF', pad: 24, border: '#CBD3DA', gap: 14 }),
    colb([iconBox('fas fa-certificate', 'Certificados', 'Descarga certificados y constancias en pocos pasos.', { align: 'left' }), button('Obtener certificado', 'https://www.gov.co/', { align: 'left' })], 31, { bg: '#FFFFFF', pad: 24, border: '#CBD3DA', gap: 14 }),
  ], { gap: 18, alignI: 'stretch' }),
])));

// 10) TRANSPARENCIA (icon-list + FX hexspin)
function iconList(items) {
  return widget('icon-list', { icon_list: items.map((it) => ({ text: it[0], selected_icon: { value: it[1], library: 'fa-solid' }, _id: id().slice(0, 7) })),
    icon_color: '#0066CC', text_color: '#0A2540', icon_typography_typography: 'custom',
    text_typography_typography: 'custom', text_typography_font_family: 'Hind Madurai', text_typography_font_size: px(16), space_between: px(12) });
}
content.push(sec({ bg: '#E7EBEE' }, boxed([
  row([
    colb([
      kicker('TRANSPARENCIA'),
      heading('Acceso a la información y transparencia', { fs: 32 }),
      text('<p>Cumplimos la Ley de Transparencia (Ley 1712) publicando de forma proactiva la información de la entidad. Consulta presupuesto, contratación y resultados de la gestión.</p>'),
      iconList([
        ['Presupuesto y ejecución', 'fas fa-file-invoice-dollar'],
        ['Contratación pública', 'fas fa-file-signature'],
        ['Rendición de cuentas', 'fas fa-bullhorn'],
        ['Datos abiertos', 'fas fa-database'],
      ]),
    ], 54, { gap: 16 }),
    colb([fx('hexspin', { h: 320, color: '#0066CC' })], 42, { alignI: 'stretch' }),
  ], { alignI: 'center', gap: 30 }),
])));

// 11) NOTICIAS (3 tarjetas nativas — barra neón + texto, sin imagen estática)
function newsCard(tag, title, desc) {
  return colb([
    rawhtml('<div style="width:52px;height:3px;background:linear-gradient(90deg,#00A8FF,#21D4FF);margin-bottom:4px"></div>'),
    kicker(tag, '#0059B3'),
    heading(title, { fs: 20, size: 'h3' }),
    text(`<p>${desc}</p>`, { fs: 15 }),
    button('Leer más', 'https://tic.narino.gov.co/', { align: 'left', bg: 'transparent', color: '#0059B3' }),
  ], 31, { bg: '#FFFFFF', pad: 22, border: '#CBD3DA', gap: 10 });
}
content.push(sec({ bg: '#F3F6F8' }, boxed([
  kicker('ACTUALIDAD', '#0059B3'),
  heading('Noticias e iniciativas', { align: 'center', fs: 32 }),
  spacer(8),
  row([
    newsCard('INNOVACIÓN', 'Laboratorio de IA para Nariño', 'Nuevos prototipos de analítica para focalizar la inversión social en el territorio.'),
    newsCard('DATOS', 'Portal de datos abiertos renovado', 'Más conjuntos de datos y tableros para la toma de decisiones basada en evidencia.'),
    newsCard('CONECTIVIDAD', 'Más municipios conectados', 'Avanza el despliegue de conectividad en zonas rurales y de difícil acceso.'),
  ], { gap: 18, alignI: 'stretch' }),
])));

// 12) CTA FINAL / CONTACTO (panel oscuro)
content.push(sec({ bg: '#0A2540', padY: 70 }, boxed([
  kicker('CONTÁCTENOS', '#21D4FF'),
  heading('Construyamos juntos el gobierno digital de Nariño', { align: 'center', color: '#FFFFFF', fs: 34 }),
  text('<p style="text-align:center">Gobernación de Nariño · Secretaría TIC, Innovación y Gobierno Abierto · Pasto, Nariño · (602) 733 2133</p>', { align: 'center', color: '#C7D2DD', fs: 16 }),
  spacer(6),
  row([button('Contáctenos', 'https://tic.narino.gov.co/contactenos/', { align: 'center' }), button('Explora los datos abiertos', 'https://datos.narino.gov.co/', { align: 'center', bg: 'transparent', color: '#FFFFFF' })], { gap: 16, alignI: 'center' }),
])));

// ====================== ENSAMBLE ======================
const template = {
  content,
  page_settings: { hide_title: 'yes', template: 'default' },
  version: '0.4',
  title: 'Landing — Secretaría TIC, Innovación y Gobierno Abierto',
  type: 'page',
};
fs.writeFileSync(OUT, JSON.stringify(template));
const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
const widgets = JSON.stringify(template).match(/"elType":"widget"/g).length;
const fxc = (JSON.stringify(template).match(/class=\\"tic-fx\\"/g) || JSON.stringify(template).match(/class=\"tic-fx\"/g) || []).length;
console.log(`OK ${OUT}`);
console.log(`size=${kb}KB  sections=${content.length}  widgets=${widgets}  fx-divs=${fxc}`);
