import React from 'react';
import { ShoppingBag, Upload, Download, Search, RefreshCw, Filter, CheckCircle2, Sun, Moon } from 'lucide-react';

export default function Navbar({
  searchTerm,
  setSearchTerm,
  selectedDept,
  setSelectedDept,
  departments,
  onFileUpload,
  onResetDefault,
  fileName,
  totalRecords,
  onExportCsv,
  theme,
  toggleTheme
}) {
  return (
    <header className="sticky top-0 z-50 glass-card border-b border-[var(--border-default)] bg-[var(--bg-surface)] backdrop-blur-md">
      <div className="max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-4">
          
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-[var(--brand-gold)] to-[var(--brand-gold-hover)] rounded-xl text-black shadow-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black gold-gradient-text">
                  CSV Precifica Analytics
                </h1>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-[var(--brand-gold)]/20 text-[var(--brand-gold)] border border-[var(--brand-gold)]/40">
                  Inteligência Comercial
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--brand-gold)]" />
                <span>Base: <strong className="text-[var(--text-primary)] font-bold">{fileName || 'Arquivo CSV'}</strong> ({totalRecords} registros com PROCV)</span>
              </p>
            </div>
          </div>

          {/* Search & Action Buttons */}
          <div className="flex items-center flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produto, marca, EAN, código..."
                className="w-full glass-input text-xs rounded-xl pl-9 pr-4 py-2 font-semibold"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--brand-gold)] text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Department Select */}
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="glass-input text-xs rounded-xl pl-3 pr-8 py-2 appearance-none cursor-pointer font-bold"
              >
                <option value="ALL" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Todos os Departamentos ({departments.length})</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {dept}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
            </div>

            {/* Theme Toggle Button & Action Buttons */}
            <div className="flex items-center gap-2">
              
              {/* Theme Toggle (Sun/Moon) */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
                className="p-2 text-xs rounded-xl bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-[var(--brand-gold)]" />
                    <span className="hidden sm:inline text-[11px] font-bold">Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-[var(--brand-gold)]" />
                    <span className="hidden sm:inline text-[11px] font-bold">Escuro</span>
                  </>
                )}
              </button>

              <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] cursor-pointer transition-colors shadow-sm">
                <Upload className="w-3.5 h-3.5 text-[var(--brand-gold)]" />
                <span>Carregar CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={onFileUpload}
                />
              </label>

              <button
                onClick={onResetDefault}
                title="Restaurar CSV Original tudo.csv"
                className="p-2 text-xs rounded-xl bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[var(--brand-gold)]" />
              </button>

              {/* Excel Exporter (.xlsx) */}
              <button
                onClick={onExportCsv}
                title="Exportar Análise para Excel (.xlsx) com Múltiplas Abas"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs btn-brand rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-extrabold">Exportar (.xlsx)</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
