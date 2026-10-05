import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Store, 
  Sparkles, 
  ArrowUpDown, 
  Search,
  X,
  AlertCircle,
  ShoppingBag,
  PackageCheck,
  Tag,
  Zap
} from 'lucide-react';
import { formatCurrency, getStoreDetails } from '../utils/csvParser';

export default function PriceMatrixTable({ 
  products, 
  competitorsList, 
  ownWebsite = 'www.farmaciassaopaulo.com.br',
  selectedCompetitor,
  setSelectedCompetitor,
  sortBy,
  setSortBy
}) {
  const [expandedRow, setExpandedRow] = useState(null);

  // Modo de Preço Selecionado: 'RETAIL' | 'WHOLESALE' | 'DE_POR' | 'PIX_LAB'
  const [priceMode, setPriceMode] = useState('RETAIL');

  // Estados de Filtros Individuais por Coluna
  const [columnFilters, setColumnFilters] = useState({
    name: '',
    dept: 'ALL',
    linha: 'ALL',
    ean: '',
    positioning: 'ALL',
    storeAvailability: {}
  });

  const toggleExpand = (code) => {
    setExpandedRow(expandedRow === code ? null : code);
  };

  const handleFilterChange = (key, val) => {
    setColumnFilters(prev => ({ ...prev, [key]: val }));
  };

  const handleStoreFilterChange = (siteUrl, val) => {
    setColumnFilters(prev => ({
      ...prev,
      storeAvailability: { ...prev.storeAvailability, [siteUrl]: val }
    }));
  };

  const resetAllColumnFilters = () => {
    setColumnFilters({
      name: '',
      dept: 'ALL',
      linha: 'ALL',
      ean: '',
      positioning: 'ALL',
      storeAvailability: {}
    });
  };

  // Lista única de Departamentos e Linhas
  const uniqueDepts = useMemo(() => {
    const set = new Set(products.map(p => p.dept).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const uniqueLinhas = useMemo(() => {
    const set = new Set(products.map(p => p.linha).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  // Contagem de itens elegíveis por cada Modo de Preço
  const modeCounts = useMemo(() => {
    let wholesale = 0;
    let dePor = 0;
    let pixLab = 0;

    products.forEach(p => {
      const stores = Object.values(p.competitorPrices);
      const hasWholesale = stores.some(c => c.isAvailable && (c.packageUnitPrice > 0 || (c.packageInfo && c.packageInfo.length > 0)));
      const hasDePor = stores.some(c => c.isAvailable && c.dePrice > c.offerPrice && c.offerPrice > 0);
      const hasPixLab = stores.some(c => c.isAvailable && (c.pixPrice > 0 || c.labPrice > 0));

      if (hasWholesale) wholesale++;
      if (hasDePor) dePor++;
      if (hasPixLab) pixLab++;
    });

    return { wholesale, dePor, pixLab, total: products.length };
  }, [products]);

  // Helper para extrair o preço ativo do concorrente conforme o modo selecionado
  const getActivePrice = (storeData) => {
    if (!storeData || !storeData.isAvailable) return 0;
    if (priceMode === 'WHOLESALE') {
      return storeData.packageUnitPrice > 0 ? storeData.packageUnitPrice : storeData.finalPrice;
    }
    if (priceMode === 'DE_POR') {
      return storeData.dePrice > 0 ? storeData.dePrice : storeData.finalPrice;
    }
    if (priceMode === 'PIX_LAB') {
      if (storeData.pixPrice > 0) return storeData.pixPrice;
      if (storeData.labPrice > 0) return storeData.labPrice;
      return storeData.finalPrice;
    }
    return storeData.finalPrice;
  };

  // Aplicação dos Filtros de Coluna + FILTRO EXCLUSIVO PELO MODO DE PREÇO SELECIONADO
  const filteredRows = useMemo(() => {
    return products.filter(prod => {
      const stores = Object.values(prod.competitorPrices);

      // FILTRAMOS A TABELA PARA MOSTRAR APENAS ITENS QUE POSSUEM A OFERTA DO MODO SELECIONADO
      if (priceMode === 'WHOLESALE') {
        const hasWholesale = stores.some(c => c.isAvailable && (c.packageUnitPrice > 0 || (c.packageInfo && c.packageInfo.length > 0)));
        if (!hasWholesale) return false;
      } else if (priceMode === 'DE_POR') {
        const hasDePor = stores.some(c => c.isAvailable && c.dePrice > c.offerPrice && c.offerPrice > 0);
        if (!hasDePor) return false;
      } else if (priceMode === 'PIX_LAB') {
        const hasPixLab = stores.some(c => c.isAvailable && (c.pixPrice > 0 || c.labPrice > 0));
        if (!hasPixLab) return false;
      }

      // FILTROS INDIVIDUAIS DE COLUNA
      if (columnFilters.name.trim()) {
        const query = columnFilters.name.toLowerCase();
        const matchesName = prod.desc.toLowerCase().includes(query);
        const matchesCode = prod.code.toLowerCase().includes(query);
        const matchesBrand = (prod.brand || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesBrand) return false;
      }

      if (columnFilters.dept !== 'ALL' && prod.dept !== columnFilters.dept) {
        return false;
      }

      if (columnFilters.linha !== 'ALL' && prod.linha !== columnFilters.linha) {
        return false;
      }

      if (columnFilters.ean.trim()) {
        if (!prod.ean.includes(columnFilters.ean.trim())) return false;
      }

      if (columnFilters.positioning !== 'ALL') {
        if (columnFilters.positioning === 'CHEAPEST' && (prod.positioning !== 'Mais Barato da Região' && prod.positioning !== 'Preço Igual ao Menor')) return false;
        if (columnFilters.positioning === 'AVERAGE' && prod.positioning !== 'Na Média de Mercado') return false;
        if (columnFilters.positioning === 'EXPENSIVE' && prod.positioning !== 'Mais Caro que Todos') return false;
      }

      for (const [siteUrl, filterVal] of Object.entries(columnFilters.storeAvailability)) {
        if (!filterVal || filterVal === 'ALL') continue;

        const storeData = prod.competitorPrices[siteUrl];
        if (filterVal === 'AVAILABLE') {
          if (!storeData || !storeData.isAvailable || storeData.finalPrice === 0) return false;
        } else if (filterVal === 'UNAVAILABLE') {
          if (storeData && storeData.isAvailable && storeData.finalPrice > 0) return false;
        } else if (filterVal === 'CHEAPEST') {
          if (!storeData || !storeData.isAvailable || storeData.finalPrice !== prod.minCompPrice) return false;
        }
      }

      return true;
    });
  }, [products, columnFilters, priceMode]);

  const hasActiveColumnFilters = 
    columnFilters.name || 
    columnFilters.dept !== 'ALL' || 
    columnFilters.linha !== 'ALL' || 
    columnFilters.ean || 
    columnFilters.positioning !== 'ALL' || 
    Object.values(columnFilters.storeAvailability).some(v => v && v !== 'ALL');

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-default)] shadow-xl w-full">
      
      {/* Header & Controls Bar */}
      <div 
        style={{ backgroundColor: 'var(--bg-surface-secondary)' }}
        className="p-3 sm:p-4 border-b border-[var(--border-default)] flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[var(--brand-gold)]" />
            <h2 className="text-base font-extrabold gold-gradient-text">
              Matriz Comparativa de Preços Lado a Lado
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
            Exibindo <strong className="text-[var(--brand-gold)] font-bold">{filteredRows.length}</strong> de {products.length} produtos monitorados
            {priceMode === 'WHOLESALE' && ' (Filtrado apenas itens com oferta de Atacado / Combos)'}
            {priceMode === 'DE_POR' && ' (Filtrado apenas itens com desconto DE / POR)'}
            {priceMode === 'PIX_LAB' && ' (Filtrado apenas itens com oferta Pix / Laboratório)'}
          </p>
        </div>

        {/* PRICE MODE SELECTOR PILLS WITH SEGMENTED PRODUCT COUNTS */}
        <div 
          style={{ backgroundColor: 'var(--bg-surface-tertiary)' }}
          className="flex flex-wrap items-center gap-1 p-1 rounded-xl border border-[var(--border-default)] shadow-inner"
        >
          <button
            onClick={() => setPriceMode('RETAIL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              priceMode === 'RETAIL'
                ? 'bg-[var(--brand-gold)] text-black shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Preço Varejo Unitário (Exibe todos os produtos)"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>🛒 Varejo ({modeCounts.total})</span>
          </button>

          <button
            onClick={() => setPriceMode('WHOLESALE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              priceMode === 'WHOLESALE'
                ? 'bg-[var(--brand-gold)] text-black shadow-md ring-2 ring-[var(--brand-gold)]/50'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Exibe EXCLUSIVAMENTE os produtos com ofertas de Atacado e Combos de Pacote (Leve 2 Pague R$ X)"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>📦 Atacado / Combos ({modeCounts.wholesale})</span>
          </button>

          <button
            onClick={() => setPriceMode('DE_POR')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              priceMode === 'DE_POR'
                ? 'bg-[var(--brand-gold)] text-black shadow-md ring-2 ring-[var(--brand-gold)]/50'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Exibe EXCLUSIVAMENTE os produtos com desoneração/desconto DE / POR"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>🏷️ Tabela DE / POR ({modeCounts.dePor})</span>
          </button>

          <button
            onClick={() => setPriceMode('PIX_LAB')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              priceMode === 'PIX_LAB'
                ? 'bg-[var(--brand-gold)] text-black shadow-md ring-2 ring-[var(--brand-gold)]/50'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Exibe EXCLUSIVAMENTE os produtos com descontos de Pix e Fidelidade Laboratório"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Pix / Laboratório ({modeCounts.pixLab})</span>
          </button>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {hasActiveColumnFilters && (
            <button
              onClick={resetAllColumnFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--color-error)]/20 text-[var(--color-error)] border border-[var(--color-error)]/40 hover:bg-[var(--color-error)]/30 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--brand-gold)]" /> Ordenar:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="glass-input text-xs rounded-lg px-2.5 py-1 font-bold cursor-pointer"
            >
              <option value="name_asc" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Nome (A - Z)</option>
              <option value="name_desc" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Nome (Z - A)</option>
              <option value="price_asc" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Preço (Menor → Maior)</option>
              <option value="price_desc" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Preço (Maior → Menor)</option>
              <option value="opportunity" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Maior Oportunidade</option>
            </select>
          </div>
        </div>

      </div>

      {/* Table Container */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-[11px] border-collapse">
          
          {/* Column Header Titles */}
          <thead>
            <tr 
              style={{ backgroundColor: 'var(--bg-surface-secondary)' }}
              className="text-[var(--text-primary)] font-extrabold border-b border-[var(--border-default)] uppercase tracking-tight text-[10px]"
            >
              <th 
                style={{ backgroundColor: 'var(--bg-surface-secondary)' }}
                className="py-2 px-1 sticky left-0 z-20 w-6 text-center"
              >#</th>
              <th 
                style={{ backgroundColor: 'var(--bg-surface-secondary)' }}
                className="py-2 px-2 sticky left-6 z-20 min-w-[180px]"
              >Produto / Descrição</th>
              <th className="py-2 px-1 text-center min-w-[75px]">Linha</th>
              <th className="py-2 px-1 text-center min-w-[80px]">Depto</th>
              <th className="py-2 px-1 text-center min-w-[85px]">EAN</th>
              
              {/* Lojas Concorrentes */}
              {competitorsList.map((comp) => {
                const details = getStoreDetails(comp.url);
                const isOwn = comp.url === ownWebsite || details.isOwn;
                return (
                  <th 
                    key={comp.url} 
                    className={`py-2 px-1 text-center min-w-[75px] border-l border-[var(--border-default)] ${
                      isOwn 
                        ? 'bg-[var(--brand-gold)]/20 text-[var(--brand-gold)] font-black border-t-2 border-t-[var(--brand-gold)]' 
                        : ''
                    }`}
                  >
                    <div className="flex flex-col items-center leading-none py-0.5">
                      <span className="text-[8px] text-[var(--text-tertiary)] font-bold uppercase">{isOwn ? 'Sua Loja' : 'Concorrente'}</span>
                      <span className="truncate max-w-[72px] text-[9.5px] font-black mt-0.5" title={details.name}>{details.short}</span>
                    </div>
                  </th>
                );
              })}

              <th className="py-2 px-1 text-center min-w-[75px] border-l border-[var(--border-default)]">Menor Mkt</th>
              <th className="py-2 px-1 text-center min-w-[115px]">Posicionamento</th>
            </tr>

            {/* FILTROS POR COLUNA */}
            <tr 
              style={{ backgroundColor: 'var(--bg-surface-secondary)' }}
              className="border-b-2 border-[var(--brand-gold)]/40 text-[10px]"
            >
              <td 
                style={{ backgroundColor: 'var(--bg-surface-secondary)' }}
                className="p-1 sticky left-0 z-20"
              ></td>
              
              {/* Filtro Produto */}
              <td 
                style={{ backgroundColor: 'var(--bg-surface-secondary)' }}
                className="p-1 sticky left-6 z-20"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={columnFilters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    placeholder="Nome/marca..."
                    className="w-full glass-input text-[9.5px] rounded pl-4 pr-1 py-0.5 font-semibold"
                  />
                  <Search className="w-2.5 h-2.5 absolute left-1 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                </div>
              </td>

              {/* Filtro Linha */}
              <td className="p-1">
                <select
                  value={columnFilters.linha}
                  onChange={(e) => handleFilterChange('linha', e.target.value)}
                  className="w-full glass-input text-[8.5px] rounded px-0.5 py-0.5 font-semibold cursor-pointer"
                >
                  <option value="ALL" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Todas ({uniqueLinhas.length})</option>
                  {uniqueLinhas.map(l => (
                    <option key={l} value={l} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">{l}</option>
                  ))}
                </select>
              </td>

              {/* Filtro Depto */}
              <td className="p-1">
                <select
                  value={columnFilters.dept}
                  onChange={(e) => handleFilterChange('dept', e.target.value)}
                  className="w-full glass-input text-[8.5px] rounded px-0.5 py-0.5 font-semibold cursor-pointer"
                >
                  <option value="ALL" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Todos ({uniqueDepts.length})</option>
                  {uniqueDepts.map(d => (
                    <option key={d} value={d} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">{d}</option>
                  ))}
                </select>
              </td>

              {/* Filtro EAN */}
              <td className="p-1">
                <input
                  type="text"
                  value={columnFilters.ean}
                  onChange={(e) => handleFilterChange('ean', e.target.value)}
                  placeholder="EAN..."
                  className="w-full glass-input text-[8.5px] rounded px-0.5 py-0.5 text-center font-semibold"
                />
              </td>

              {/* Filtro por Loja Concorrente */}
              {competitorsList.map(comp => (
                <td key={comp.url} className="p-0.5 border-l border-[var(--border-default)]">
                  <select
                    value={columnFilters.storeAvailability[comp.url] || 'ALL'}
                    onChange={(e) => handleStoreFilterChange(comp.url, e.target.value)}
                    className="w-full glass-input text-[8px] rounded px-0.5 py-0.5 font-semibold cursor-pointer"
                  >
                    <option value="ALL" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Todas</option>
                    <option value="AVAILABLE" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Com Preço</option>
                    <option value="CHEAPEST" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Menor Preço</option>
                    <option value="UNAVAILABLE" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Indisponível</option>
                  </select>
                </td>
              ))}

              <td className="p-1 border-l border-[var(--border-default)]"></td>

              {/* Filtro Posicionamento */}
              <td className="p-1">
                <select
                  value={columnFilters.positioning}
                  onChange={(e) => handleFilterChange('positioning', e.target.value)}
                  className="w-full glass-input text-[8.5px] rounded px-0.5 py-0.5 font-bold text-center cursor-pointer"
                >
                  <option value="ALL" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Todos Status</option>
                  <option value="CHEAPEST" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Mais Barato / Igual</option>
                  <option value="AVERAGE" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Na Média</option>
                  <option value="EXPENSIVE" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Mais Caro que Todos</option>
                </select>
              </td>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[var(--border-default)] font-medium text-[var(--text-primary)]">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={competitorsList.length + 7} className="py-8 text-center text-[var(--text-tertiary)]">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <AlertCircle className="w-6 h-6 text-[var(--text-tertiary)]" />
                    <span className="font-bold text-xs">Nenhum produto encontrado na categoria do modo "{priceMode}" com os filtros atuais.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((prod) => {
                const isExpanded = expandedRow === prod.code;

                const availablePrices = Object.entries(prod.competitorPrices)
                  .filter(([_, data]) => data.isAvailable && getActivePrice(data) > 0)
                  .map(([site, data]) => ({ site, price: getActivePrice(data) }));

                const minRowPrice = availablePrices.length > 0 ? Math.min(...availablePrices.map(a => a.price)) : 0;
                const maxRowPrice = availablePrices.length > 0 ? Math.max(...availablePrices.map(a => a.price)) : 0;

                return (
                  <React.Fragment key={prod.code}>
                    <tr 
                      className={`hover:bg-[var(--bg-surface-secondary)] transition-colors ${
                        isExpanded ? 'bg-[var(--bg-surface-secondary)]' : ''
                      }`}
                    >
                      {/* Expand Toggle */}
                      <td 
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                        className="py-2 px-1 text-center sticky left-0 z-10"
                      >
                        <button 
                          onClick={() => toggleExpand(prod.code)}
                          className="p-0.5 rounded hover:bg-[var(--bg-surface-tertiary)] text-[var(--text-tertiary)] cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3 text-[var(--brand-gold)]" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>

                      {/* Product Name & Code */}
                      <td 
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                        className="py-2 px-2 sticky left-6 z-10 font-medium min-w-[180px]"
                      >
                        <div className="flex flex-col">
                          <span 
                            onClick={() => toggleExpand(prod.code)}
                            className="text-[var(--text-primary)] font-bold text-[11px] leading-tight hover:text-[var(--brand-gold)] transition-colors cursor-pointer" 
                            title={prod.desc}
                          >
                            {prod.desc}
                          </span>
                          <div className="flex items-center gap-1 text-[9px] text-[var(--text-tertiary)] mt-0.5 font-semibold">
                            <span>Cód: <strong className="text-[var(--text-primary)]">{prod.code}</strong></span>
                            {prod.brand && <span className="truncate max-w-[100px]">• {prod.brand}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Linha de Produto (Árvore PROCV) */}
                      <td className="py-2 px-1 text-center whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--brand-gold)]/15 text-[var(--brand-gold)] font-extrabold text-[8.5px] uppercase border border-[var(--brand-gold)]/30">
                          {prod.linha || 'OUTROS'}
                        </span>
                      </td>

                      {/* Depto */}
                      <td className="py-2 px-1 text-center text-[9px] whitespace-nowrap">
                        <span className="px-1 py-0.5 rounded bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)] font-semibold text-[8.5px] uppercase">
                          {prod.dept}
                        </span>
                      </td>

                      {/* EAN */}
                      <td className="py-2 px-1 text-center font-mono text-[var(--text-tertiary)] font-semibold text-[9px]">
                        {prod.ean || '-'}
                      </td>

                      {/* Competitor Price Cells per Price Mode */}
                      {competitorsList.map((comp) => {
                        const storeData = prod.competitorPrices[comp.url];
                        const details = getStoreDetails(comp.url);
                        const isOwn = comp.url === ownWebsite || details.isOwn;

                        if (!storeData) {
                          return (
                            <td key={comp.url} className={`py-2 px-1 text-center text-[var(--text-tertiary)] border-l border-[var(--border-default)] text-[9.5px] ${isOwn ? 'bg-[var(--brand-gold)]/10' : ''}`}>
                              -
                            </td>
                          );
                        }

                        const { isAvailable } = storeData;
                        const displayPrice = getActivePrice(storeData);

                        const isCheapest = isAvailable && displayPrice > 0 && Math.abs(displayPrice - minRowPrice) < 0.02 && availablePrices.length > 1;
                        const isMostExpensive = isAvailable && displayPrice > 0 && Math.abs(displayPrice - maxRowPrice) < 0.02 && availablePrices.length > 1;

                        return (
                          <td 
                            key={comp.url} 
                            className={`py-2 px-1 text-center border-l border-[var(--border-default)] text-[10px] font-bold ${isOwn ? 'bg-[var(--brand-gold)]/15' : ''}`}
                          >
                            {!isAvailable ? (
                              <span className="text-[8px] text-[var(--text-tertiary)] line-through px-1 py-0.5 rounded bg-[var(--bg-surface-tertiary)] whitespace-nowrap font-medium">
                                Indisponível
                              </span>
                            ) : displayPrice === 0 ? (
                              <span className="text-[var(--text-tertiary)] text-[8.5px]">Sem Oferta</span>
                            ) : (
                              <div className="flex flex-col items-center">
                                {/* Exibição Dinâmica do Valor */}
                                <span className={`px-1 py-0.5 rounded text-[10px] font-black transition-all whitespace-nowrap ${
                                  isCheapest
                                    ? 'bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/30'
                                    : isMostExpensive
                                    ? 'bg-[var(--color-error)]/20 text-[var(--color-error)] border border-[var(--color-error)]/30'
                                    : isOwn
                                    ? 'bg-[var(--brand-gold)]/25 text-[var(--brand-gold)] border border-[var(--brand-gold)]/40'
                                    : 'text-[var(--text-primary)]'
                                }`}>
                                  {formatCurrency(displayPrice)}
                                </span>

                                {/* SUBTÍTULOS INFORMATIVOS CONFORME MODO SELECIONADO */}
                                {priceMode === 'WHOLESALE' && storeData.packageInfo && (
                                  <span className="text-[7.5px] text-[var(--brand-gold)] font-extrabold truncate max-w-[65px] mt-0.5" title={storeData.packageInfo}>
                                    📦 {storeData.packageInfo}
                                  </span>
                                )}

                                {priceMode === 'DE_POR' && storeData.dePrice > storeData.offerPrice && storeData.offerPrice > 0 && (
                                  <span className="text-[7.5px] text-[var(--color-error)] font-extrabold mt-0.5">
                                    De {formatCurrency(storeData.dePrice)}
                                  </span>
                                )}

                                {priceMode === 'PIX_LAB' && (
                                  <span className="text-[7.5px] text-[var(--color-success)] font-extrabold mt-0.5">
                                    {storeData.pixPrice > 0 ? '⚡ Pix' : storeData.labPrice > 0 ? '🧪 PBM' : ''}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Menor Preço do Mercado */}
                      <td className="py-2 px-1 text-center border-l border-[var(--border-default)] font-extrabold text-[var(--color-success)] text-[10px] bg-[var(--bg-surface-secondary)] whitespace-nowrap">
                        {minRowPrice > 0 ? formatCurrency(minRowPrice) : '-'}
                      </td>

                      {/* Posicionamento Badge */}
                      <td className="py-2 px-1 text-center whitespace-nowrap min-w-[115px]">
                        <span className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-black tracking-tight uppercase inline-flex items-center gap-0.5 whitespace-nowrap ${
                          prod.positioning === 'Mais Barato da Região' || prod.positioning === 'Preço Igual ao Menor'
                            ? 'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30'
                            : prod.positioning === 'Mais Caro que Todos'
                            ? 'bg-[var(--color-error)]/15 text-[var(--color-error)] border border-[var(--color-error)]/30'
                            : prod.positioning === 'Na Média de Mercado'
                            ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                            : 'bg-[var(--bg-surface-tertiary)] text-[var(--text-tertiary)]'
                        }`}>
                          {prod.positioning}
                        </span>
                      </td>
                    </tr>

                    {/* Row Expansion Detail Card */}
                    {isExpanded && (
                      <tr className="bg-[var(--bg-surface-secondary)] border-y border-[var(--brand-gold)]/30">
                        <td colSpan={competitorsList.length + 7} className="p-4">
                          
                          <div className="mb-3 flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
                            <h4 className="text-xs font-black text-[var(--brand-gold)] flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-[var(--brand-gold)]" />
                              Detalhamento de Preço das 4 Visões: <strong className="text-[var(--text-primary)]">{prod.desc}</strong>
                            </h4>
                            <span className="text-[10px] text-[var(--text-tertiary)] font-bold">Cód: {prod.code} | EAN: {prod.ean || 'N/A'}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            
                            {/* Card 1: Varejo Unitário */}
                            <div className="glass-card p-3 rounded-xl border border-[var(--border-default)]">
                              <h5 className="text-[11px] font-black text-[var(--brand-gold)] flex items-center gap-1.5 mb-2">
                                <ShoppingBag className="w-3.5 h-3.5" /> 🛒 Preço Varejo (Unitário)
                              </h5>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between border-b border-[var(--border-default)] pb-1">
                                  <span className="text-[var(--text-secondary)] font-bold">Sua Loja:</span>
                                  <strong className="text-[var(--brand-gold)] font-black">{formatCurrency(prod.ownPrice)}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[var(--text-secondary)]">Menor Mercado:</span>
                                  <strong className="text-[var(--color-success)] font-bold">{formatCurrency(prod.minCompPrice)}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[var(--text-secondary)]">Média Mercado:</span>
                                  <strong className="text-[var(--accent-primary)] font-bold">{formatCurrency(prod.avgCompPrice)}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Card 2: Atacado & Combos */}
                            <div className="glass-card p-3 rounded-xl border border-[var(--border-default)]">
                              <h5 className="text-[11px] font-black text-[var(--brand-gold)] flex items-center gap-1.5 mb-2">
                                <PackageCheck className="w-3.5 h-3.5" /> 📦 Atacado / Combos (Pacotes)
                              </h5>
                              <div className="space-y-1.5 text-[11px]">
                                {Object.entries(prod.competitorPrices).filter(([_, c]) => c.packageUnitPrice > 0 || c.packageInfo).length === 0 ? (
                                  <p className="text-[var(--text-tertiary)] italic">Sem ofertas de pacote/atacado registradas para este produto.</p>
                                ) : (
                                  Object.entries(prod.competitorPrices).filter(([_, c]) => c.packageUnitPrice > 0 || c.packageInfo).map(([site, data]) => {
                                    const details = getStoreDetails(site);
                                    return (
                                      <div key={site} className="border-b border-[var(--border-default)] pb-1">
                                        <div className="flex justify-between">
                                          <span className="text-[var(--text-primary)] font-bold">{details.short}:</span>
                                          <strong className="text-[var(--brand-gold)] font-black">{formatCurrency(data.packageUnitPrice)}/un</strong>
                                        </div>
                                        {data.packageInfo && (
                                          <p className="text-[9.5px] text-[var(--text-secondary)] font-semibold">{data.packageInfo}</p>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            {/* Card 3: Tabela DE / POR */}
                            <div className="glass-card p-3 rounded-xl border border-[var(--border-default)]">
                              <h5 className="text-[11px] font-black text-[var(--brand-gold)] flex items-center gap-1.5 mb-2">
                                <Tag className="w-3.5 h-3.5" /> 🏷️ Preço DE vs Preço POR
                              </h5>
                              <div className="space-y-1.5 text-[11px]">
                                {Object.entries(prod.competitorPrices).map(([site, data]) => {
                                  const details = getStoreDetails(site);
                                  if (!data.isAvailable) return null;
                                  return (
                                    <div key={site} className="flex justify-between border-b border-[var(--border-default)] pb-0.5">
                                      <span className="text-[var(--text-primary)] font-bold">{details.short}:</span>
                                      <div className="text-right">
                                        {data.dePrice > data.offerPrice && data.offerPrice > 0 && (
                                          <span className="text-[9px] text-[var(--color-error)] line-through mr-1">De {formatCurrency(data.dePrice)}</span>
                                        )}
                                        <strong className="text-[var(--color-success)] font-black">{formatCurrency(data.finalPrice)}</strong>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Card 4: Pix & Laboratório (PBM) */}
                            <div className="glass-card p-3 rounded-xl border border-[var(--border-default)]">
                              <h5 className="text-[11px] font-black text-[var(--brand-gold)] flex items-center gap-1.5 mb-2">
                                <Zap className="w-3.5 h-3.5" /> ⚡ Pix & Laboratório (PBM)
                              </h5>
                              <div className="space-y-1.5 text-[11px]">
                                {Object.entries(prod.competitorPrices).filter(([_, c]) => c.pixPrice > 0 || c.labPrice > 0).length === 0 ? (
                                  <p className="text-[var(--text-tertiary)] italic">Sem ofertas exclusivas de Pix/Laboratório registradas.</p>
                                ) : (
                                  Object.entries(prod.competitorPrices).filter(([_, c]) => c.pixPrice > 0 || c.labPrice > 0).map(([site, data]) => {
                                    const details = getStoreDetails(site);
                                    return (
                                      <div key={site} className="flex justify-between border-b border-[var(--border-default)] pb-1">
                                        <span className="text-[var(--text-primary)] font-bold">{details.short}:</span>
                                        <div className="text-right">
                                          {data.pixPrice > 0 && <span className="text-[var(--color-success)] font-black mr-1">Pix: {formatCurrency(data.pixPrice)}</span>}
                                          {data.labPrice > 0 && <span className="text-[var(--accent-primary)] font-black">PBM: {formatCurrency(data.labPrice)}</span>}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
