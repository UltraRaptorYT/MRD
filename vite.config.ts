import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import terser from "@rollup/plugin-terser";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@mediapipe/hands"],
  },
  build: {
    rollupOptions: {
      plugins: [
        terser({
          keep_classnames: true, // Prevent class names from being mangled
          keep_fnames: true, // Prevent function names from being mangled
        }),
      ],
    },
  },
});
