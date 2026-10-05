import React from 'react';
import { Package, TrendingDown, TrendingUp, DollarSign, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export default function KpiOverview({ stats, selectedPositioning, setSelectedPositioning }) {
  const {
    totalSkus = 0,
    cheapestCount = 0,
    expensiveCount = 0,
    averageCount = 0,
    opportunitiesCount = 0
  } = stats || {};

  const cheapestPercent = totalSkus > 0 ? Math.round((cheapestCount / totalSkus) * 100) : 0;
  const expensivePercent = totalSkus > 0 ? Math.round((expensiveCount / totalSkus) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      
      {/* Total Produtos Card */}
      <div 
        onClick={() => setSelectedPositioning('ALL')}
        className={`glass-card p-4 rounded-2xl cursor-pointer transition-all border ${
          selectedPositioning === 'ALL' 
            ? 'border-[var(--brand-gold)] ring-2 ring-[var(--brand-gold)]/40' 
            : 'border-[var(--border-default)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Total de Produtos</span>
          <div className="p-2 bg-[var(--bg-surface-secondary)] rounded-xl text-[var(--brand-gold)] border border-[var(--brand-gold)]/30">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[var(--text-primary)]">{totalSkus}</span>
          <span className="text-xs font-bold text-[var(--text-secondary)]">itens monitorados</span>
        </div>
        <div className="mt-2 text-[11px] font-semibold text-[var(--text-tertiary)]">
          Pesquisa de preços consolidada
        </div>
      </div>

      {/* Menor Preço da Região Card */}
      <div 
        onClick={() => setSelectedPositioning('CHEAPEST')}
        className={`glass-card p-4 rounded-2xl cursor-pointer transition-all border ${
          selectedPositioning === 'CHEAPEST' 
            ? 'border-[var(--color-success)] ring-2 ring-[var(--color-success)]/40' 
            : 'border-[var(--border-default)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Menor Preço da Região</span>
          <div className="p-2 bg-[var(--color-success)]/10 rounded-xl text-[var(--color-success)] border border-[var(--color-success)]/30">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[var(--color-success)]">{cheapestCount}</span>
          <span className="text-xs font-bold text-[var(--color-success)]">({cheapestPercent}%)</span>
        </div>
        <div className="mt-2 text-[11px] font-bold text-[var(--color-success)] flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Liderando competitividade
        </div>
      </div>

      {/* Na Média Card */}
      <div 
        onClick={() => setSelectedPositioning('AVERAGE')}
        className={`glass-card p-4 rounded-2xl cursor-pointer transition-all border ${
          selectedPositioning === 'AVERAGE' 
            ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40' 
            : 'border-[var(--border-default)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Na Média de Mercado</span>
          <div className="p-2 bg-[var(--accent-primary)]/10 rounded-xl text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[var(--accent-primary)]">{averageCount}</span>
          <span className="text-xs font-bold text-[var(--text-secondary)]">produtos</span>
        </div>
        <div className="mt-2 text-[11px] font-semibold text-[var(--text-tertiary)]">
          Alinhados à concorrência
        </div>
      </div>

      {/* Mais Caro Que Todos Card */}
      <div 
        onClick={() => setSelectedPositioning('EXPENSIVE')}
        className={`glass-card p-4 rounded-2xl cursor-pointer transition-all border ${
          selectedPositioning === 'EXPENSIVE' 
            ? 'border-[var(--color-error)] ring-2 ring-[var(--color-error)]/40' 
            : 'border-[var(--border-default)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Mais Caro que Todos</span>
          <div className="p-2 bg-[var(--color-error)]/10 rounded-xl text-[var(--color-error)] border border-[var(--color-error)]/30">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[var(--color-error)]">{expensiveCount}</span>
          <span className="text-xs font-bold text-[var(--color-error)]">({expensivePercent}%)</span>
        </div>
        <div className="mt-2 text-[11px] font-bold text-[var(--color-error)] flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Requer revisão urgente
        </div>
      </div>

      {/* Oportunidades de Lucro Card */}
      <div 
        onClick={() => setSelectedPositioning('OPPORTUNITY')}
        className={`glass-card p-4 rounded-2xl cursor-pointer transition-all border ${
          selectedPositioning === 'OPPORTUNITY' 
            ? 'border-[var(--brand-gold)] ring-2 ring-[var(--brand-gold)]/40' 
            : 'border-[var(--border-default)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-[var(--brand-gold)] uppercase tracking-wide">Oportunidades de Margem</span>
          <div className="p-2 bg-[var(--brand-gold)]/20 rounded-xl text-[var(--brand-gold)] border border-[var(--brand-gold)]/40">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[var(--brand-gold)]">{opportunitiesCount}</span>
          <span className="text-xs text-[var(--brand-gold)] font-bold">alertas</span>
        </div>
        <div className="mt-2 text-[11px] text-[var(--brand-gold)] font-bold">
          Sugestões de reprecificação
        </div>
      </div>

    </div>
  );
}
