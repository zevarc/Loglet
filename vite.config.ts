import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
    environment: "jsdom",
    globals: false,
    coverage: {
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/**/*.test.ts", "src/lib/components/**"],
    },
    benchmark: {
      include: ["src/**/*.bench.{js,ts}"],
    },
  },

  server: {
    port: 5173,
    strictPort: false,
  },

  build: {
    target: "es2022",
    sourcemap: true,
  },

  worker: {
    format: "es",
  },
});
