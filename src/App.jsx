import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import KpiOverview from './components/KpiOverview';
import PriceMatrixTable from './components/PriceMatrixTable';
import AnalyticsCharts from './components/AnalyticsCharts';
import OpportunityList from './components/OpportunityList';
import { processRawCsvData } from './utils/csvParser';
import { exportAnalysisToExcel } from './utils/excelExporter';
import Papa from 'papaparse';
import { 
  LayoutGrid, 
  BarChart2, 
  Sparkles, 
  AlertTriangle, 
  UploadCloud, 
  FileSpreadsheet, 
  ShieldCheck, 
  ArrowRight,
  Database
} from 'lucide-react';

export default function App() {
  // Theme state: 'dark' | 'light' com suporte a prefers-color-scheme
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('precifica_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('precifica_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Escutar mudanças nas preferências do SO se não houver preferência salva
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('precifica_theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // State de Dados
  const [rawRecords, setRawRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Filtros & Ordenação Globais
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'charts' | 'opportunities'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedPositioning, setSelectedPositioning] = useState('ALL');
  const [selectedCompetitor, setSelectedCompetitor] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc'); // 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'opportunity'

  // Carregar o arquivo CSV padrão (tudo.csv)
  const loadDefaultCsv = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.BASE_URL}api/default-csv`);
      if (!response.ok) {
        throw new Error('Não foi possível carregar o CSV padrão.');
      }
      const fetchedFileName = response.headers.get('X-CSV-Filename') || 'tudo.csv';
      setFileName(fetchedFileName);

      const arrayBuffer = await response.arrayBuffer();
      const decoder = new TextDecoder('iso-8859-1');
      const csvText = decoder.decode(arrayBuffer);

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setRawRecords(results.data);
          setLoading(false);
        },
        error: (err) => {
          setError(`Erro ao interpretar o arquivo CSV: ${err.message}`);
          setLoading(false);
        }
      });
    } catch (err) {
      console.error(err);
      setError('Falha ao conectar com o servidor para buscar o arquivo CSV padrão.');
      setLoading(false);
    }
  };

  // Processamento de arquivo enviado (Upload manual ou Drag & Drop)
  const processFile = (file) => {
    if (!file) return;

    setLoading(true);
    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const csvText = evt.target.result;
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setRawRecords(results.data);
          setLoading(false);
        },
        error: (err) => {
          setError(`Erro ao interpretar o arquivo enviado: ${err.message}`);
          setLoading(false);
        }
      });
    };
    reader.readAsText(file, 'iso-8859-1');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Parsing e Inteligência Mercadológica
  const parsedData = useMemo(() => {
    if (!rawRecords.length) return { products: [], competitorsList: [], stats: {} };
    return processRawCsvData(rawRecords);
  }, [rawRecords]);

  // Lista única de Departamentos para a Navbar
  const departments = useMemo(() => {
    if (!parsedData.products.length) return [];
    const set = new Set(parsedData.products.map(p => p.dept).filter(Boolean));
    return Array.from(set).sort();
  }, [parsedData.products]);

  // Produtos Filtrados por Pesquisa Global, Departamento e Posicionamento
  const filteredProducts = useMemo(() => {
    let result = parsedData.products;

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.desc.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query) ||
        p.ean.includes(query) ||
        (p.brand || '').toLowerCase().includes(query)
      );
    }

    if (selectedDept !== 'ALL') {
      result = result.filter(p => p.dept === selectedDept);
    }

    if (selectedPositioning !== 'ALL') {
      if (selectedPositioning === 'CHEAPEST') {
        result = result.filter(p => p.positioning === 'Mais Barato da Região' || p.positioning === 'Preço Igual ao Menor');
      } else if (selectedPositioning === 'AVERAGE') {
        result = result.filter(p => p.positioning === 'Na Média de Mercado');
      } else if (selectedPositioning === 'EXPENSIVE') {
        result = result.filter(p => p.positioning === 'Mais Caro que Todos');
      } else if (selectedPositioning === 'OPPORTUNITY') {
        result = result.filter(p => p.opportunity !== null);
      }
    }

    if (selectedCompetitor !== 'ALL') {
      result = result.filter(p => {
        const compData = p.competitorPrices[selectedCompetitor];
        return compData && compData.isAvailable && compData.finalPrice > 0;
      });
    }

    // Ordenação
    result = [...result].sort((a, b) => {
      if (sortBy === 'name_asc') return a.desc.localeCompare(b.desc);
      if (sortBy === 'name_desc') return b.desc.localeCompare(a.desc);
      if (sortBy === 'price_asc') return a.ownPrice - b.ownPrice;
      if (sortBy === 'price_desc') return b.ownPrice - a.ownPrice;
      if (sortBy === 'opportunity') {
        const oppA = a.opportunity ? 1 : 0;
        const oppB = b.opportunity ? 1 : 0;
        return oppB - oppA;
      }
      return 0;
    });

    return result;
  }, [parsedData.products, searchTerm, selectedDept, selectedPositioning, selectedCompetitor, sortBy]);

  // Exportação para Excel (.xlsx) Multi-Abas
  const handleExportExcel = () => {
    exportAnalysisToExcel(filteredProducts, parsedData.competitorsList, parsedData.stats);
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedDept={selectedDept}
        setSelectedDept={setSelectedDept}
        departments={departments}
        onFileUpload={handleFileUpload}
        onResetDefault={loadDefaultCsv}
        fileName={fileName}
        totalRecords={rawRecords.length}
        onExportCsv={handleExportExcel}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="max-w-[1920px] mx-auto px-2 sm:px-4 pt-4 flex-1 w-full overflow-x-hidden flex flex-col">
        
        {/* State Alerts */}
        {loading && (
          <div className="glass-card p-12 text-center rounded-2xl my-8 border border-[var(--brand-gold)]">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[var(--brand-gold)] border-t-transparent mb-4"></div>
            <p className="text-[var(--brand-gold)] font-extrabold text-base">Carregando e processando inteligência de preços ({fileName})...</p>
            <p className="text-[var(--text-tertiary)] text-xs mt-1 font-semibold">Cruzando PROCV da Árvore Mercadológica e mapeando cotações das redes</p>
          </div>
        )}

        {error && (
          <div className="glass-card p-6 border border-[var(--color-error)] rounded-2xl my-6 text-[var(--color-error)] flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-sm">Erro ao carregar os dados</h3>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* TELA DE BOAS-VINDAS / UPLOAD (Exibida se nenhum arquivo tiver sido carregado) */}
        {!loading && !error && rawRecords.length === 0 && (
          <div className="my-auto py-12 flex flex-col items-center justify-center">
            <div className="max-w-2xl w-full text-center">
              
              {/* Badge Inicial */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-gold)]/20 text-[var(--brand-gold)] text-xs font-black uppercase tracking-wider border border-[var(--brand-gold)]/40 mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Inteligência de Precificação Comercial
              </span>

              <h2 className="text-3xl sm:text-4xl font-black gold-gradient-text tracking-tight mb-3">
                Selecione ou Arraste sua Base de Preços (.csv)
              </h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium mb-8">
                Sua análise é 100% isolada e processada no seu navegador. Escolha o seu próprio arquivo CSV ou utilize a base demonstrativa da empresa.
              </p>

              {/* Zona Drag & Drop */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`glass-card p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center ${
                  isDragging 
                    ? 'border-[var(--brand-gold)] bg-[var(--brand-gold)]/10 scale-[1.01]' 
                    : 'border-[var(--border-default)] hover:border-[var(--accent-primary)]'
                }`}
              >
                <div className="p-4 rounded-2xl bg-[var(--bg-surface-secondary)] text-[var(--brand-gold)] border border-[var(--border-default)] mb-4">
                  <UploadCloud className="w-10 h-10" />
                </div>

                <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] mb-1">
                  Arraste seu arquivo CSV aqui
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] font-semibold mb-6">
                  Suporta arquivos `.csv` cotação de mercado com PROCV
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="flex items-center gap-2 px-5 py-3 text-xs btn-brand rounded-xl shadow-lg cursor-pointer transition-all">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Selecionar Meu CSV</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>

                  <span className="text-xs text-[var(--text-tertiary)] font-bold">ou</span>

                  <button
                    onClick={loadDefaultCsv}
                    className="flex items-center gap-2 px-5 py-3 text-xs rounded-xl bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--brand-gold)] transition-all font-bold cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-[var(--brand-gold)]" />
                    <span>Carregar Base Demonstrativa (tudo.csv)</span>
                  </button>
                </div>
              </div>

              {/* Card de Privacidade */}
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[var(--color-success)]" />
                <span>Privacidade Garantida: O CSV enviado permanece exclusivo para esta aba do seu computador.</span>
              </div>

            </div>
          </div>
        )}

        {/* DASHBOARD COMPLETO (Exibido após carregar dados) */}
        {!loading && !error && rawRecords.length > 0 && (
          <>
            {/* KPI Overview Component */}
            <KpiOverview
              stats={parsedData.stats}
              selectedPositioning={selectedPositioning}
              setSelectedPositioning={setSelectedPositioning}
            />

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3 mb-6 gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('matrix')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'matrix'
                      ? 'bg-[var(--brand-gold)] text-black shadow-lg font-black'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Matriz Comparativa ({filteredProducts.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('charts')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'charts'
                      ? 'bg-[var(--brand-gold)] text-black shadow-lg font-black'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)]'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>Gráficos & Analytics</span>
                </button>

                <button
                  onClick={() => setActiveTab('opportunities')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'opportunities'
                      ? 'bg-[var(--brand-gold)] text-black shadow-lg font-black'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Oportunidades ({parsedData.stats.opportunitiesCount})</span>
                </button>
              </div>

              {/* Active Filter Indicator */}
              {selectedPositioning !== 'ALL' && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--text-secondary)] font-bold">Filtro Ativo:</span>
                  <span className="px-2.5 py-1 rounded-full bg-[var(--brand-gold)]/20 text-[var(--brand-gold)] border border-[var(--brand-gold)]/40 font-black uppercase text-[10px]">
                    {selectedPositioning}
                  </span>
                  <button
                    onClick={() => setSelectedPositioning('ALL')}
                    className="text-xs text-[var(--brand-gold)] font-bold underline hover:opacity-80 ml-1 cursor-pointer"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>

            {/* Tab Views */}
            {activeTab === 'matrix' && (
              <PriceMatrixTable
                products={filteredProducts}
                competitorsList={parsedData.competitorsList}
                ownWebsite="www.farmaciassaopaulo.com.br"
                selectedCompetitor={selectedCompetitor}
                setSelectedCompetitor={setSelectedCompetitor}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            )}

            {activeTab === 'charts' && (
              <AnalyticsCharts
                products={parsedData.products}
                competitorsList={parsedData.competitorsList}
                stats={parsedData.stats}
                theme={theme}
              />
            )}

            {activeTab === 'opportunities' && (
              <OpportunityList
                products={filteredProducts}
                onSelectProduct={(code) => {
                  setActiveTab('matrix');
                }}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-[var(--border-default)] text-center text-xs text-[var(--text-tertiary)] font-medium">
        <p>CSV Precifica Analytics • Inteligência Competitiva de Preços com PROCV da Árvore Mercadológica</p>
      </footer>

    </div>
  );
}
