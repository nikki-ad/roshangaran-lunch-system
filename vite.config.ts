import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base path for deployment (uncomment and modify for GitHub Pages)
  // base: '/roshangaran-lunch-system/',
  
server: {
  host: "0.0.0.0",
  port: 8080,
  strictPort: true,
  allowedHosts: [
    'all',
    '6422ecc8-645b-4b77-89aa-9835be3883a4-00-30k7f02hsowzj.worf.replit.dev'
  ],
  hmr: {
    clientPort: 443,
    protocol: 'wss'
  }
},
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
