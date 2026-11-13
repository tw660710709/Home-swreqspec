import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/dormitories": "http://127.0.0.1:8000",
      // รองรับ CON-ACC-01, CON-AUTH-01, FR-DOR-09 และ AC-DOR-07
      "/owners": "http://127.0.0.1:8000",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: [],
  },
});