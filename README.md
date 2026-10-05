# 📊 CSV Precifica Analytics

> **Plataforma de Inteligência de Precificação Competitiva e Análise de Mercado Farmacêutico**  
> *Interface moderna em Windows 11 Fluent Design (Mica Material) com suporte nativo a Docker.*

---

## 🌟 Visão Geral

O **CSV Precifica Analytics** é um sistema corporativo de alta performance desenvolvido para automatizar e otimizar a tomada de decisões de precificação no varejo farmacêutico.

A plataforma cruza automaticamente relatórios de cotação de mercado (`.csv`) com a **Árvore Mercadológica** da empresa (Departamento, Linha e EAN), permitindo comparar lado a lado os preços da sua loja contra os principais concorrentes do mercado (Drogasil, Raia, Pague Menos, Panvel, São Paulo, Nissei, etc.).

---

## 🚀 Principais Funcionalidades

### 1. 📊 Matriz Comparativa de Preços Lado a Lado
- Comparativo em tempo real com destaque dinâmico para o **menor preço da região** (verde), **preço mais caro** (vermelho) e **preço da sua loja** (âmbar).
- Cabeçalhos e colunas fixas (*sticky*) para navegação fluida em grandes bases de dados.
- Filtros avançados por produto, marca, EAN, departamento, linha e disponibilidade por concorrente.

### 2. 🔀 Segmentação em 4 Visões de Preço
- **🛒 Preço Varejo Unitário**: Valor padrão por unidade vendida.
- **📦 Atacado / Combos**: Ofertas de pacotes e volumes ("Leve 2 Pague R$ X").
- **🏷️ Tabela DE / POR**: Descontos promocionais e corte de preço.
- **⚡ Pix & Laboratório (PBM)**: Preços diferenciados por meio de pagamento instantâneo e convênios de fidelidade de laboratório.

### 3. 🎯 Central de Oportunidades Automática
- Algoritmo inteligente que varre o catálogo e identifica oportunidades imediatas de reprecificação.
- Sugestão automática de novo preço com arredondamento psicológico (`R$ X,90` / `R$ X,99`) mantendo competitividade e otimizando margem de lucro.

### 4. 📈 Dashboards & Analytics Interativos
- Visualização gráfica da distribuição de posicionamento (Mais Barato, Na Média, Mais Caro).
- Comparativos por departamento e análise de elasticidade de preço via Chart.js.

### 5. 🔒 Privacidade & Upload Drag & Drop
- Processamento 100% no navegador do usuário via Web Workers e PapaParse.
- Tela de boas-vindas para upload manual de arquivos `.csv` via arraste e solte (*Drag & Drop*) ou carregamento da base demonstrativa padrão.

### 6. 📑 Exportação Multi-Aba para Excel (`.xlsx`)
- Geração automatizada de relatórios em Excel com abas organizadas por **Resumo de Indicadores**, **Matriz Comparativa** e **Oportunidades de Reprecificação**.

---

## 🎨 Sistema de Design (Windows 11 Fluent Design)

- **Mica Material & Tokens Semânticos**: Cores tokenizadas para máxima legibilidade e profundidade visual.
- **Modo Escuro (Dark) e Claro (Light)**: Sincronização automática com a preferência do sistema operacional (`prefers-color-scheme`) e alternância manual salva em `localStorage`.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Chart.js, PapaParse, XLSX.
- **Backend / Server**: Node.js, Express.
- **Containerização**: Docker, Docker Compose (Multi-stage build com `node:20-alpine`).

---

## 🐳 Como Executar com Docker

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/) instalado.

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/Sarayva/csv-precifica-analytics.git
   cd csv-precifica-analytics
   ```

2. **Iniciar o container com Docker Compose:**
   ```bash
   docker compose up -d
   ```

3. **Acessar no navegador:**
   - **Local:** `http://localhost:3000`
   - **Rede Local (LAN):** `http://<SEU-IP-LOCAL>:3000`

---

## 💻 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Gerar build de produção
npm run build

# Iniciar servidor de produção Node.js
npm start
```

---

## 📄 Licença

Este projeto é de uso exclusivo para inteligência de mercado e precificação comercial.
