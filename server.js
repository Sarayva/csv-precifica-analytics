import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para habilitar CORS e cabeçalhos
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Endpoint para servir o CSV padrão (tudo.csv)
app.get('/api/default-csv', (req, res) => {
  let csvPath = path.resolve(__dirname, 'tudo.csv');
  let fileName = 'tudo.csv';
  if (!fs.existsSync(csvPath)) {
    csvPath = path.resolve(__dirname, 'dados-6056-2026100509-1363096.csv');
    fileName = 'dados-6056-2026100509-1363096.csv';
  }
  if (fs.existsSync(csvPath)) {
    const fileBuffer = fs.readFileSync(csvPath);
    res.setHeader('Content-Type', 'text/csv; charset=iso-8859-1');
    res.setHeader('X-CSV-Filename', fileName);
    return res.send(fileBuffer);
  }
  return res.status(404).json({ error: 'Arquivo CSV padrão não encontrado.' });
});

// Servir os arquivos estáticos compilados pelo Vite (pasta dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback SPA para index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CSV Precifica Analytics rodando em http://localhost:${PORT}`);
});
