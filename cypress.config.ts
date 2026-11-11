import 'dotenv/config';
import { defineConfig } from 'cypress';
import { plugin as cypressGrepPlugin } from '@cypress/grep/plugin';

export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportPageTitle: 'ServeRest · Cypress',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
  },
  retries: { runMode: process.env.CI ? 1 : 0, openMode: 0 },
  video: false,
  viewportWidth: 1280,
  viewportHeight: 800,
  defaultCommandTimeout: 7_000,
  e2e: {
    baseUrl: process.env.FRONT_URL ?? 'https://front.serverest.dev',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    expose: {
      apiUrl: process.env.API_URL ?? 'https://serverest.dev',
    },
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      cypressGrepPlugin(config);
      return config;
    },
  },
});
