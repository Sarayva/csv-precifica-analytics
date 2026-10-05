import React, { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Tag, Info } from 'lucide-react';
import { formatCurrency } from '../utils/csvParser';

export default function OpportunityList({ products, onSelectProduct }) {
  const [oppFilter, setOppFilter] = useState('ALL'); // 'ALL' | 'RAISE_FOR_MARGIN' | 'REDUCE_TO_MATCH'

  const oppProducts = products.filter(p => p.opportunity !== null);

  const raiseMarginCount = oppProducts.filter(p => p.opportunity?.type === 'RAISE_FOR_MARGIN').length;
  const reduceMatchCount = oppProducts.filter(p => p.opportunity?.type === 'REDUCE_TO_MATCH').length;

  const filteredOpportunities = oppProducts.filter(p => {
    if (oppFilter === 'RAISE_FOR_MARGIN') return p.opportunity?.type === 'RAISE_FOR_MARGIN';
    if (oppFilter === 'REDUCE_TO_MATCH') return p.opportunity?.type === 'REDUCE_TO_MATCH';
    return true;
  });

  return (
    <div className="glass-card rounded-2xl p-6 border border-[var(--border-default)]">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[var(--border-default)] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--brand-gold)]" />
            <h2 className="text-lg font-black gold-gradient-text">
              Central de Oportunidades de Precificação e Margem
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-semibold mt-1">
            Sugestões automáticas baseadas em inteligência competitiva e regras de precificação dinâmica
          </p>
        </div>

        {/* Opportunity Filter Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-surface-secondary)] p-1 rounded-xl border border-[var(--border-default)]">
          <button
            onClick={() => setOppFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              oppFilter === 'ALL'
                ? 'bg-[var(--brand-gold)] text-black shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--brand-gold)]'
            }`}
          >
            <span>Todas ({oppProducts.length})</span>
          </button>

          <button
            onClick={() => setOppFilter('RAISE_FOR_MARGIN')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              oppFilter === 'RAISE_FOR_MARGIN'
                ? 'bg-[var(--color-success)] text-black shadow-md'
                : 'text-[var(--color-success)] hover:bg-[var(--color-success)]/10'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Subir Preço / Margem ({raiseMarginCount})</span>
          </button>

          <button
            onClick={() => setOppFilter('REDUCE_TO_MATCH')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              oppFilter === 'REDUCE_TO_MATCH'
                ? 'bg-[var(--color-error)] text-white shadow-md'
                : 'text-[var(--color-error)] hover:bg-[var(--color-error)]/10'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Reduzir / Cobrir Concorrente ({reduceMatchCount})</span>
          </button>
        </div>
      </div>

      {/* Grid de Oportunidades */}
      {filteredOpportunities.length === 0 ? (
        <div className="py-12 text-center text-[var(--text-tertiary)]">
          <Info className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2" />
          <p className="text-sm font-bold">Nenhuma oportunidade encontrada para este filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filteredOpportunities.map((prod) => {
            const isRaise = prod.opportunity.type === 'RAISE_FOR_MARGIN';

            return (
              <div
                key={prod.code}
                className={`glass-card p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                  isRaise 
                    ? 'border-[var(--color-success)]/40 bg-[var(--color-success)]/5' 
                    : 'border-[var(--color-error)]/40 bg-[var(--color-error)]/5'
                }`}
              >
                {/* Header Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide flex items-center gap-1 ${
                    isRaise 
                      ? 'bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/30' 
                      : 'bg-[var(--color-error)]/20 text-[var(--color-error)] border border-[var(--color-error)]/30'
                  }`}>
                    {isRaise ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {prod.opportunity.label}
                  </span>

                  <span className="px-2 py-0.5 rounded bg-[var(--brand-gold)]/20 text-[var(--brand-gold)] text-[9px] font-black uppercase border border-[var(--brand-gold)]/30">
                    {prod.linha || 'OUTROS'}
                  </span>
                </div>

                {/* Product Title */}
                <h3 className="text-xs font-extrabold text-[var(--text-primary)] line-clamp-2 min-h-[32px] leading-snug">
                  {prod.desc}
                </h3>
                <p className="text-[10px] text-[var(--text-secondary)] font-semibold mt-1">
                  Cód: <strong className="text-[var(--text-primary)]">{prod.code}</strong> {prod.brand && `• ${prod.brand}`}
                </p>

                {/* Price Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 rounded-lg bg-[var(--bg-surface-secondary)] border border-[var(--border-default)] text-center">
                  <div>
                    <span className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase">Preço Atual</span>
                    <p className="text-xs font-black text-[var(--text-primary)] mt-0.5">{formatCurrency(prod.ownPrice)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase">Menor Mkt</span>
                    <p className="text-xs font-black text-[var(--color-success)] mt-0.5">{formatCurrency(prod.minCompPrice)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-[var(--brand-gold)] font-black uppercase">Sugerido</span>
                    <p className="text-xs font-black text-[var(--brand-gold)] mt-0.5">{formatCurrency(prod.opportunity.suggestedPrice)}</p>
                  </div>
                </div>

                {/* Recommendation Footer */}
                <div className="mt-3 pt-3 border-t border-[var(--border-default)] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-primary)] font-bold">
                    <Tag className="w-3.5 h-3.5 text-[var(--brand-gold)]" />
                    <span className="leading-tight">{prod.opportunity.recommendation}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
