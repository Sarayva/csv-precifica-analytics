import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// Plugin customizado para servir o arquivo CSV do workspace (prioriza tudo.csv)
function serveWorkspaceCsvPlugin() {
  return {
    name: 'serve-workspace-csv',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/default-csv' || req.url.startsWith('/api/default-csv?')) {
          let csvPath = path.resolve(process.cwd(), 'tudo.csv');
          let fileName = 'tudo.csv';
          if (!fs.existsSync(csvPath)) {
            csvPath = path.resolve(process.cwd(), 'dados-6056-2026100509-1363096.csv');
            fileName = 'dados-6056-2026100509-1363096.csv';
          }
          if (fs.existsSync(csvPath)) {
            const fileBuffer = fs.readFileSync(csvPath);
            res.setHeader('Content-Type', 'text/csv; charset=iso-8859-1');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('X-CSV-Filename', fileName);
            res.end(fileBuffer);
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveWorkspaceCsvPlugin()],
  server: {
    port: 3000,
    host: true
  }
});
