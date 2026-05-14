// Despachador de decoración: cada nivel tiene su propio módulo de escenario
// con elementos detallados del sitio turístico.

import { decorateGaleras } from './galeras.js';
import { decorateCocha } from './cocha.js';
import { decorateLajas } from './lajas.js';
import { decorateAzufral } from './azufral.js';
import { decorateCumbal } from './cumbal.js';
import { decorateCarnaval } from './carnaval.js';
import { decorateAwa } from './awa.js';
import { decorateNambi } from './nambi.js';
import { decorateTumaco } from './tumaco.js';
import { decoratePueblos } from './pueblos.js';

const DECORATORS = {
  volcano: decorateGaleras,
  lake: decorateCocha,
  church: decorateLajas,
  crater: decorateAzufral,
  snow_volcano: decorateCumbal,
  carnival: decorateCarnaval,
  jungle: decorateAwa,
  cloud_forest: decorateNambi,
  beach: decorateTumaco,
  sacred: decoratePueblos
};

// ctx = { group, obstacles, animated } — animated recibe meshes con userData de animación
export function decorateLevel(level, ctx) {
  const fn = DECORATORS[level.theme];
  if (fn) fn(level, ctx);
}
