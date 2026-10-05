import Papa from 'papaparse';
import arvoreData from '../data/arvoreLookup.json';

/**
 * Converte strings de preços brasileiras (ex: "16,79", "35,70", "R$ 16,79") para float.
 */
export function parsePrice(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/R\$\s?/gi, '').replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Formata um número para moeda brasileira R$.
 */
export function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

/**
 * Mapeia nomes amigáveis de lojas a partir das URLs dos websites.
 */
export const STORE_MAP = {
  'www.farmaciassaopaulo.com.br': { name: 'Farmácias São Paulo', isOwn: true, short: 'São Paulo', color: '#06b6d4' },
  'www.paguemenos.com.br': { name: 'Pague Menos', isOwn: false, short: 'Pague Menos', color: '#3b82f6' },
  'www.drogariasaopaulo.com.br': { name: 'Drogaria São Paulo', isOwn: false, short: 'Drog. São Paulo', color: '#ef4444' },
  'www.drogaraia.com.br': { name: 'Droga Raia', isOwn: false, short: 'Droga Raia', color: '#10b981' },
  'www.panvel.com': { name: 'Panvel', isOwn: false, short: 'Panvel', color: '#8b5cf6' },
  'www.precopopular.com.br': { name: 'Preço Popular', isOwn: false, short: 'Preço Popular', color: '#f59e0b' },
  'www.farmaciasnissei.com.br': { name: 'Farmácias Nissei', isOwn: false, short: 'Nissei', color: '#ec4899' },
  'www.saojoaofarmacias.com.br': { name: 'São João Farmácias', isOwn: false, short: 'São João', color: '#6366f1' }
};

export function getStoreDetails(urlStr) {
  if (!urlStr) return { name: 'Desconhecido', isOwn: false, short: 'Desc', color: '#94a3b8' };
  const cleanUrl = urlStr.toLowerCase().trim();
  for (const [key, details] of Object.entries(STORE_MAP)) {
    if (cleanUrl.includes(key) || key.includes(cleanUrl)) {
      return details;
    }
  }
  const domain = cleanUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return { name: domain, isOwn: false, short: domain.slice(0, 10), color: '#64748b' };
}

/**
 * Normaliza a Linha de Produto para as Macro Linhas Estratégicas oficiais da rede.
 */
export function normalizeLinha(rawLinha, category) {
  let val = rawLinha;
  if (!val || val === 'NAO DEFINIDO' || val === 'NÃO DEFINIDO') {
    if (!category || category === 'NAO DEFINIDO') return 'OUTROS';
    const catUpper = category.toUpperCase();
    if (catUpper.includes('CONTROLADO') || catUpper.includes('ETICO') || catUpper.includes('RX')) return 'RX - ETICO';
    if (catUpper.includes('OTC') || catUpper.includes('HEPATOPROTETOR')) return 'OTC';
    if (catUpper.includes('SIMILAR')) return 'SIMILAR';
    if (catUpper.includes('GENERICO')) return 'GENERICO';
    if (catUpper.includes('DERMO')) return 'DERMOCOSMETICOS';
    if (catUpper.includes('LEITE') || catUpper.includes('INFANTIL')) return 'LEITES';
    if (catUpper.includes('FRALDA')) return 'FRALDAS';
    if (catUpper.includes('PERFUMARIA') || catUpper.includes('HIGIENE') || catUpper.includes('CABELO')) return 'PERFUMARIA';
    if (catUpper.includes('SUPLEMENTO')) return 'SUPLEMENTOS ALIMENTARES';
    return 'OUTROS';
  }

  const upper = String(val).toUpperCase().trim();
  if (upper.includes('CONTROLADO')) return 'RX - ETICO';
  if (upper === 'BRINQUEDOS' || upper === 'VAREJINHO' || upper === 'CONVENIENCIA') return 'CONVENIÊNCIA & DIVERSOS';
  return upper;
}

/**
 * Realiza o PROCV (VLOOKUP) da Árvore Mercadológica para encontrar a LINHA do produto.
 */
export function lookupLinha(code, ean, category) {
  const { codeToLinha = {}, eanToLinha = {} } = arvoreData || {};

  let raw = null;
  if (code && codeToLinha[code]) {
    raw = codeToLinha[code];
  } else if (ean && eanToLinha[ean]) {
    raw = eanToLinha[ean];
  }

  return normalizeLinha(raw, category);
}

/**
 * Processa as linhas cruas do CSV e agrupa os dados por produto (SKU) e por concorrente.
 */
export function processRawCsvData(rawRecords, ownWebsite = 'www.farmaciassaopaulo.com.br') {
  if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
    return { products: [], competitorsList: [], stats: {} };
  }

  // Identificar todas as lojas únicas no arquivo
  const uniqueWebsites = new Set();
  rawRecords.forEach(r => {
    const site = r['Website Monitorado'] || r['website_monitorado'] || r['Website'];
    if (site) uniqueWebsites.add(site.trim());
  });

  const competitorsList = Array.from(uniqueWebsites).map(site => ({
    url: site,
    ...getStoreDetails(site)
  })).sort((a, b) => (b.isOwn ? 1 : 0) - (a.isOwn ? 1 : 0)); // Colocar loja própria em primeiro

  // Agrupar por Código interno do produto
  const productMap = new Map();

  rawRecords.forEach(row => {
    const code = (row['Código'] || row['codigo'] || row['SKU Monitorado'] || 'SemCodigo').trim();
    const desc = (row['Descrição'] || row['descricao'] || row['Produto Monitorado'] || 'Sem Descrição').trim();
    const ean = (row['Código de Barras'] || row['codigo_de_barras'] || '').trim();
    const dept = (row['Departamento'] || row['departamento'] || 'GERAL').trim();
    const category = (row['Categoria/Setor'] || row['categoria'] || '').trim();
    const brand = (row['Marca'] || row['marca'] || '').trim();
    const stock = parseInt(row['Quantidade em Estoque'] || '0', 10) || 0;
    const siteUrl = (row['Website Monitorado'] || '').trim();
    
    // PROCV da Árvore para extrair a LINHA de produto
    const linha = lookupLinha(code, ean, category);

    // Preços estendidos e variações
    const normalPrice = parsePrice(row['Preço Normal']);
    const offerPrice = parsePrice(row['Preço Oferta']);
    const finalPrice = (offerPrice > 0) ? offerPrice : normalPrice;
    const dePrice = parsePrice(row['Preço De']) || normalPrice;
    const pixPrice = parsePrice(row['Preço Pix']);
    const packageUnitPrice = parsePrice(row['Preço cada Un. do Pacote']);
    const packageInfo = (row['Inf. Pacotes'] || '').trim();
    const labPrice = parsePrice(row['Preço Laboratório']);
    const costPrice = parsePrice(row['Preço de Custo']);
    const availability = (row['Disponibilidade'] || 'disponível').toLowerCase().trim();

    if (!productMap.has(code)) {
      productMap.set(code, {
        code,
        desc,
        ean,
        dept,
        linha,
        category,
        brand,
        stock,
        costPrice,
        competitorPrices: {},
        availableStoresCount: 0,
        totalStoresCount: 0
      });
    }

    const prod = productMap.get(code);
    
    if (siteUrl) {
      prod.competitorPrices[siteUrl] = {
        normalPrice,
        offerPrice,
        finalPrice,
        dePrice,
        pixPrice,
        packageUnitPrice,
        packageInfo,
        labPrice,
        availability,
        isAvailable: availability.includes('dispon'),
        raw: row
      };

      prod.totalStoresCount += 1;
      if (availability.includes('dispon') && finalPrice > 0) {
        prod.availableStoresCount += 1;
      }
    }
  });

  // Processar estatísticas consolidadas por produto
  const products = Array.from(productMap.values()).map(prod => {
    const ownData = prod.competitorPrices[ownWebsite] || Object.values(prod.competitorPrices).find(c => getStoreDetails(Object.keys(prod.competitorPrices).find(key => prod.competitorPrices[key] === c)).isOwn);
    const ownPrice = ownData ? ownData.finalPrice : 0;

    const compPrices = [];
    const allPrices = [];

    Object.entries(prod.competitorPrices).forEach(([site, data]) => {
      if (data.finalPrice > 0) {
        allPrices.push({ site, price: data.finalPrice, isOwn: site === ownWebsite });
        if (site !== ownWebsite && data.isAvailable) {
          compPrices.push({ site, price: data.finalPrice });
        }
      }
    });

    const validCompValues = compPrices.map(c => c.price);
    const minCompPrice = validCompValues.length > 0 ? Math.min(...validCompValues) : 0;
    const maxCompPrice = validCompValues.length > 0 ? Math.max(...validCompValues) : 0;
    const avgCompPrice = validCompValues.length > 0 ? (validCompValues.reduce((a, b) => a + b, 0) / validCompValues.length) : 0;

    const cheapestComp = compPrices.length > 0 ? compPrices.reduce((prev, curr) => curr.price < prev.price ? curr : prev, compPrices[0]) : null;

    let positioning = 'Sem Dados';
    let diffVsMin = 0;
    let diffVsAvg = 0;

    if (ownPrice > 0) {
      if (validCompValues.length === 0) {
        positioning = 'Sem Concorrentes Diretos';
      } else if (ownPrice < minCompPrice) {
        positioning = 'Mais Barato da Região';
        diffVsMin = ((ownPrice - minCompPrice) / minCompPrice) * 100;
      } else if (Math.abs(ownPrice - minCompPrice) < 0.05) {
        positioning = 'Preço Igual ao Menor';
        diffVsMin = 0;
      } else if (ownPrice > maxCompPrice) {
        positioning = 'Mais Caro que Todos';
        diffVsMin = ((ownPrice - minCompPrice) / minCompPrice) * 100;
      } else {
        positioning = 'Na Média de Mercado';
        diffVsMin = ((ownPrice - minCompPrice) / minCompPrice) * 100;
      }

      if (avgCompPrice > 0) {
        diffVsAvg = ((ownPrice - avgCompPrice) / avgCompPrice) * 100;
      }
    }

    let opportunity = null;
    if (ownPrice > 0 && minCompPrice > 0) {
      if (ownPrice > minCompPrice) {
        const diffAmount = ownPrice - minCompPrice;
        opportunity = {
          type: 'REDUCE_TO_MATCH',
          label: 'Ajustar para Cobrir Concorrente',
          recommendation: `Reduzir ${formatCurrency(diffAmount)} para igualar a ${getStoreDetails(cheapestComp?.site).name}`,
          suggestedPrice: minCompPrice,
          impact: 'Garantir Competitividade',
          severity: diffVsMin > 20 ? 'high' : 'medium'
        };
      } else if (ownPrice < minCompPrice && (minCompPrice - ownPrice) > 1.50) {
        const potentialIncrease = minCompPrice - 0.10;
        const marginGain = potentialIncrease - ownPrice;
        opportunity = {
          type: 'RAISE_FOR_MARGIN',
          label: 'Oportunidade de Ganho de Margem',
          recommendation: `Aumentar para ${formatCurrency(potentialIncrease)} mantendo-se o mais barato (Ganho de ${formatCurrency(marginGain)}/un)`,
          suggestedPrice: potentialIncrease,
          impact: 'Aumentar Margem de Lucro',
          severity: 'opportunity'
        };
      }
    }

    return {
      ...prod,
      ownPrice,
      minCompPrice,
      maxCompPrice,
      avgCompPrice,
      cheapestComp,
      positioning,
      diffVsMin,
      diffVsAvg,
      opportunity,
      compPricesCount: compPrices.length
    };
  });

  const totalSkus = products.length;
  const cheapestCount = products.filter(p => p.positioning === 'Mais Barato da Região' || p.positioning === 'Preço Igual ao Menor').length;
  const expensiveCount = products.filter(p => p.positioning === 'Mais Caro que Todos').length;
  const averageCount = products.filter(p => p.positioning === 'Na Média de Mercado').length;
  const opportunitiesCount = products.filter(p => p.opportunity !== null).length;

  return {
    products,
    competitorsList,
    stats: {
      totalSkus,
      totalRecords: rawRecords.length,
      cheapestCount,
      expensiveCount,
      averageCount,
      opportunitiesCount,
      competitorsCount: competitorsList.length
    }
  };
}
