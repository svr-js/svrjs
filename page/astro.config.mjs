// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  build: {
    assets: "assets"
  },
  integrations: [tailwind({ applyBaseStyles: false })],
  vite: {
    ssr: {
      noExternal: ['@fontsource/inter'],
    }
  }
});