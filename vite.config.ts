import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "/admiral_mers/",
  build: { sourcemap: false },
  server: { watch: { ignored: ["**/.work/**"] } },
});
