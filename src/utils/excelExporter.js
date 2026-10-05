import * as XLSX from 'xlsx';
import { formatCurrency, getStoreDetails } from './csvParser';

export function exportAnalysisToExcel(products, competitorsList, stats) {
  if (!products || products.length === 0) return;

  const workbook = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // ABA 1: Matriz Comparativa Completa (Varejo & Tabela DE/POR)
  // -------------------------------------------------------------
  const matrixRows = products.map(p => {
    const row = {
      'Código': p.code,
      'Descrição do Produto': p.desc,
      'Linha (Árvore)': p.linha || 'NÃO DEFINIDO',
      'Departamento': p.dept,
      'EAN': p.ean || '-',
      'Marca': p.brand || '-',
      'Estoque': p.stock,
      'Sua Loja (R$)': p.ownPrice > 0 ? p.ownPrice : 'Sem Preço'
    };

    // Preços de cada concorrente
    competitorsList.forEach(comp => {
      if (!comp.isOwn) {
        const cData = p.competitorPrices[comp.url];
        row[`Preço ${comp.name}`] = (cData && cData.isAvailable && cData.finalPrice > 0) ? cData.finalPrice : 'Indisponível';
      }
    });

    row['Menor Mkt (R$)'] = p.minCompPrice > 0 ? p.minCompPrice : '-';
    row['Médio Mkt (R$)'] = p.avgCompPrice > 0 ? Number(p.avgCompPrice.toFixed(2)) : '-';
    row['Maior Mkt (R$)'] = p.maxCompPrice > 0 ? p.maxCompPrice : '-';
    row['Posicionamento'] = p.positioning;
    row['Recomendação'] = p.opportunity ? p.opportunity.recommendation : 'Preço Alinhado';

    return row;
  });

  const matrixSheet = XLSX.utils.json_to_sheet(matrixRows);
  matrixSheet['!cols'] = [
    { wch: 10 }, { wch: 45 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 50 }
  ];
  XLSX.utils.book_append_sheet(workbook, matrixSheet, 'Matriz Varejo');

  // -------------------------------------------------------------
  // ABA 2: Atacado & Ofertas de Pacote ("Leve 2 Pague R$ X")
  // -------------------------------------------------------------
  const wholesaleProducts = products.filter(p => {
    return Object.values(p.competitorPrices).some(c => c.isAvailable && (c.packageUnitPrice > 0 || (c.packageInfo && c.packageInfo.length > 0)));
  });

  const wholesaleRows = wholesaleProducts.map(p => {
    const row = {
      'Código': p.code,
      'Descrição do Produto': p.desc,
      'Linha (Árvore)': p.linha || 'NÃO DEFINIDO',
      'Departamento': p.dept,
      'EAN': p.ean || '-'
    };

    competitorsList.forEach(comp => {
      if (!comp.isOwn) {
        const cData = p.competitorPrices[comp.url];
        if (cData && cData.isAvailable && (cData.packageUnitPrice > 0 || cData.packageInfo)) {
          row[`Atacado ${comp.name}`] = cData.packageUnitPrice > 0 ? cData.packageUnitPrice : cData.finalPrice;
          row[`Regra Pacote ${comp.name}`] = cData.packageInfo || 'Preço Regular';
        } else {
          row[`Atacado ${comp.name}`] = 'Sem Oferta Atacado';
          row[`Regra Pacote ${comp.name}`] = '-';
        }
      }
    });

    return row;
  });

  const wholesaleSheet = XLSX.utils.json_to_sheet(wholesaleRows.length > 0 ? wholesaleRows : [{ 'Mensagem': 'Nenhum produto com oferta de Atacado / Combo encontrado nos filtros atuais.' }]);
  XLSX.utils.book_append_sheet(workbook, wholesaleSheet, 'Atacado e Combos');

  // -------------------------------------------------------------
  // ABA 3: Oportunidades de Margem
  // -------------------------------------------------------------
  const oppProducts = products.filter(p => p.opportunity !== null);
  const opportunityRows = oppProducts.map(p => ({
    'Código': p.code,
    'Descrição do Produto': p.desc,
    'Linha (Árvore)': p.linha || 'NÃO DEFINIDO',
    'Departamento': p.dept,
    'Tipo de Oportunidade': p.opportunity.type === 'RAISE_FOR_MARGIN' ? 'Subir Preço (Ganhar Margem)' : 'Reduzir Preço (Cobrir Concorrente)',
    'Preço Atual (R$)': p.ownPrice,
    'Menor Concorrente (R$)': p.minCompPrice,
    'Preço Sugerido (R$)': p.opportunity.suggestedPrice,
    'Ganho / Diferença (R$)': Math.abs(p.opportunity.suggestedPrice - p.ownPrice).toFixed(2),
    'Ação Recomendada': p.opportunity.recommendation
  }));

  const oppSheet = XLSX.utils.json_to_sheet(opportunityRows.length > 0 ? opportunityRows : [{ 'Mensagem': 'Nenhuma oportunidade de preço detectada nos filtros atuais.' }]);
  oppSheet['!cols'] = [
    { wch: 10 }, { wch: 45 }, { wch: 18 }, { wch: 20 },
    { wch: 32 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 55 }
  ];
  XLSX.utils.book_append_sheet(workbook, oppSheet, 'Oportunidades de Margem');

  // -------------------------------------------------------------
  // ABA 4: Resumo Executivo e KPIs
  // -------------------------------------------------------------
  const kpiRows = [
    { 'Métrica / Indicador': 'Total de Produtos Analisados', 'Valor': stats?.totalSkus || 0 },
    { 'Métrica / Indicador': 'Produtos com Menor Preço da Região', 'Valor': stats?.cheapestCount || 0 },
    { 'Métrica / Indicador': 'Produtos Na Média de Mercado', 'Valor': stats?.averageCount || 0 },
    { 'Métrica / Indicador': 'Produtos Mais Caros que Todos', 'Valor': stats?.expensiveCount || 0 },
    { 'Métrica / Indicador': 'Alertas de Oportunidades Identificados', 'Valor': stats?.opportunitiesCount || 0 },
    { 'Métrica / Indicador': 'Total de Concorrentes Monitorados', 'Valor': stats?.competitorsCount || 0 },
    { 'Métrica / Indicador': 'Data e Hora do Relatório', 'Valor': new Date().toLocaleString('pt-BR') }
  ];

  const kpiSheet = XLSX.utils.json_to_sheet(kpiRows);
  kpiSheet['!cols'] = [{ wch: 40 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, kpiSheet, 'Resumo Executivo');

  // Download do arquivo XLSX
  const filename = `relatorio_precificacao_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
