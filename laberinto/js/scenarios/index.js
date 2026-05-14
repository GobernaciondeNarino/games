// Despachador de decoración: cada nivel tiene su propio módulo de escenario
// con elementos detallados del sitio turístico.

import { decorateGaleras } from './galeras.js?v=4';
import { decorateCocha } from './cocha.js?v=4';
import { decorateLajas } from './lajas.js?v=4';
import { decorateAzufral } from './azufral.js?v=4';
import { decorateCumbal } from './cumbal.js?v=4';
import { decorateCarnaval } from './carnaval.js?v=4';
import { decorateAwa } from './awa.js?v=4';
import { decorateNambi } from './nambi.js?v=4';
import { decorateTumaco } from './tumaco.js?v=4';
import { decoratePueblos } from './pueblos.js?v=4';

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
