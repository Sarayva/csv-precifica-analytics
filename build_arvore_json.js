import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const filePath = './arvore outubro.xls';
console.log('Generating compact tree lookup from:', filePath);

try {
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  const codeToLinha = {};
  const eanToLinha = {};
  const descToLinha = {};

  let count = 0;
  rows.forEach(row => {
    const code = row['CódigoProduto'] ? String(row['CódigoProduto']).trim() : '';
    const ean = row['EAN'] ? String(row['EAN']).trim() : '';
    const desc = row['DescriçãoProduto'] ? String(row['DescriçãoProduto']).trim().toUpperCase() : '';
    const linha = row['Linha'] ? String(row['Linha']).trim() : '';

    if (linha && linha !== 'NAO DEFINIDO' && linha !== 'NÃO DEFINIDO') {
      if (code) codeToLinha[code] = linha;
      if (ean && ean !== '0') eanToLinha[ean] = linha;
      if (desc) descToLinha[desc] = linha;
      count++;
    }
  });

  console.log(`Mapped ${count} valid product tree records.`);
  console.log(`Total Codes: ${Object.keys(codeToLinha).length}, Total EANs: ${Object.keys(eanToLinha).length}`);

  const outputDir = path.resolve('src/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'arvoreLookup.json');
  fs.writeFileSync(outputPath, JSON.stringify({ codeToLinha, eanToLinha }, null, 2));
  console.log('Successfully saved compact tree lookup to:', outputPath);

} catch (err) {
  console.error('Error generating tree lookup:', err);
}
