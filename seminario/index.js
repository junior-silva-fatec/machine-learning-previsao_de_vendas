const fs = require('fs');
const csv = require('csv-parser');

let data = [];

fs.createReadStream('./Walmart_Store_sales.csv')  // Substitua com o caminho do seu arquivo CSV
  .pipe(csv())
  .on('data', (row) => {
    data.push(row);
  })
  .on('end', () => {
    analyzeData(data);
  });

function analyzeData(data) {
  if (data.length === 0) {
    console.log('Arquivo vazio ou inválido!');
    return;
  }

  // Obter todas as chaves (colunas) do CSV
  const columns = Object.keys(data[0]);
  
  columns.forEach((column) => {
    const values = data.map((row) => parseFloat(row[column])).filter((value) => !isNaN(value));

    const totalValues = values.length;
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const mean = sum / totalValues;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const stdDev = Math.sqrt(squaredDifferences.reduce((acc, curr) => acc + curr, 0) / totalValues);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const missingValues = data.length - totalValues;

    console.log(`Análise da coluna "${column}":`);
    console.log(`  Total de valores: ${totalValues}`);
    console.log(`  Média: ${mean.toFixed(2)}`);
    console.log(`  Desvio padrão: ${stdDev.toFixed(2)}`);
    console.log(`  Mínimo: ${min}`);
    console.log(`  Máximo: ${max}`);
    console.log(`  Valores ausentes: ${missingValues}`);
    console.log('-------------------------------');
  });
}
