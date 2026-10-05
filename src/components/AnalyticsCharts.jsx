import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { getStoreDetails } from '../utils/csvParser';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AnalyticsCharts({ products, competitorsList, stats, theme }) {
  const isLight = theme === 'light';
  const textColor = isLight ? '#1A1A1A' : '#FFFFFF';
  const textMuted = isLight ? '#5D5D5D' : '#A0A0A0';
  const gridColor = isLight ? '#E5E5E5' : '#3F3F3F';
  const brandGold = isLight ? '#D97706' : '#FCA311';

  // 1. Dados do Gráfico de Ranking de Competitividade
  const competitorAverages = competitorsList.map(comp => {
    let sum = 0;
    let count = 0;
    products.forEach(p => {
      const price = p.competitorPrices[comp.url]?.finalPrice;
      if (price && price > 0) {
        sum += price;
        count++;
      }
    });
    return {
      name: comp.short,
      isOwn: comp.isOwn,
      avg: count > 0 ? (sum / count) : 0
    };
  }).filter(c => c.avg > 0).sort((a, b) => a.avg - b.avg);

  const barData = {
    labels: competitorAverages.map(c => c.name),
    datasets: [
      {
        label: 'Preço Médio do Portfólio (R$)',
        data: competitorAverages.map(c => Number(c.avg.toFixed(2))),
        backgroundColor: competitorAverages.map(c => 
          c.isOwn 
            ? brandGold 
            : isLight ? '#0067C0' : '#60CDFF'
        ),
        borderColor: competitorAverages.map(c => 
          c.isOwn 
            ? (isLight ? '#B45309' : '#E89200')
            : (isLight ? '#005FB8' : '#7AD7FF')
        ),
        borderWidth: 1,
        borderRadius: 8
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => ` Preço Médio: R$ ${context.raw.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: textColor, font: { size: 11, weight: 'bold' } },
        grid: { color: gridColor }
      },
      y: {
        ticks: { color: textMuted, font: { size: 10 } },
        grid: { color: gridColor }
      }
    }
  };

  // 2. Dados do Gráfico de Posicionamento (Rosca)
  const doughnutData = {
    labels: [
      'Mais Barato / Igual ao Menor',
      'Na Média do Mercado',
      'Mais Caro que Todos'
    ],
    datasets: [
      {
        data: [
          stats?.cheapestCount || 0,
          stats?.averageCount || 0,
          stats?.expensiveCount || 0
        ],
        backgroundColor: [
          isLight ? '#107C10' : '#6CCB5F', // Success Green
          isLight ? '#0067C0' : '#60CDFF', // Accent Blue
          isLight ? '#C42B1C' : '#FF99A4'  // Error Red
        ],
        borderColor: isLight ? '#FFFFFF' : '#2B2B2B',
        borderWidth: 2
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: textColor,
          font: { size: 11, weight: '600' },
          padding: 15
        }
      }
    },
    cutout: '70%'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      
      {/* Ranking Bar Chart */}
      <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-[var(--border-default)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold gold-gradient-text">
              Ranking de Competitividade por Rede Varejista
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Média ponderada de preço do portfólio monitorado (Menor valor = Mais competitivo)
            </p>
          </div>
        </div>
        <div className="h-64">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Doughnut Chart */}
      <div className="glass-card p-5 rounded-2xl border border-[var(--border-default)] flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold gold-gradient-text">
            Posicionamento de Mercado
          </h3>
          <p className="text-xs text-[var(--text-tertiary)]">
            Distribuição do seu catálogo frente aos concorrentes
          </p>
        </div>
        <div className="h-56 relative flex items-center justify-center my-2">
          <Doughnut data={doughnutData} options={doughnutOptions} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-extrabold text-[var(--brand-gold)]">{stats?.totalSkus || 0}</span>
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">PRODUTOS</span>
          </div>
        </div>
      </div>

    </div>
  );
}
