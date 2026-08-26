import { defineConfig, devices } from '@playwright/test';

/**
 * Los criterios de accesibilidad que necesitan navegador de verdad.
 *
 * Los modulos ES nativos no cargan desde `file://`, asi que la pagina se sirve por HTTP con
 * `tools/servir.js` — sin dependencias, y es tambien el procedimiento de despliegue.
 */
export default defineConfig({
  testDir: './tests/navegador',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:51733',
    // La tableta de la consulta. Tactil activo, porque es la via primaria.
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
  },
  webServer: {
    command: 'node tools/servir.js 51733',
    url: 'http://localhost:51733/index.html',
    reuseExistingServer: true,
    timeout: 20000,
  },
});
