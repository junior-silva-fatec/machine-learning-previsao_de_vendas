const fs = require('fs');
const csv = require('csv-parser');
const regression = require('regression');

let data = [];
let colunas = ["Store", "Date", "Weekly_Sales", "Holiday_Flag", 
  "Temperature", "Fuel_Price", "CPI", "Unemployment"
];

fs.createReadStream('./Walmart_Store_sales.csv')  // Substitua com o caminho do seu arquivo CSV
  .pipe(csv())
  .on('data', (row) => {
    data.push(row);
  })
  .on('end', () => {
    analyzeData(data);
    performLinearRegression(data, 'Temperature', 'Weekly_Sales');  // Substitua pelos nomes das colunas
    calculatePearsonCorrelation(data, 'Temperature', 'Weekly_Sales'); // Substitua pelos nomes das colunas
  });
  
function analyzeData(data) {
  if (data.length === 0) {
    console.log('Arquivo vazio ou inválido!');
    return;
  }

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

function performLinearRegression(data, columnX, columnY) {
  // Obter os dados das colunas X e Y
  const xData = data.map((row) => parseFloat(row[columnX])).filter((value) => !isNaN(value));
  const yData = data.map((row) => parseFloat(row[columnY])).filter((value) => !isNaN(value));

  // Certifique-se de que ambas as colunas têm o mesmo tamanho
  if (xData.length !== yData.length) {
    console.log('As colunas têm diferentes quantidades de dados.');
    return;
  }

  // Organize os dados em um formato adequado para a regressão
  const regressionData = xData.map((value, index) => [value, yData[index]]);

  // Realiza a regressão linear
  const result = regression.linear(regressionData);

  // Exibe o resultado da regressão
  console.log(`Regressão linear entre "${columnX}" e "${columnY}":`);
  console.log(`Equação: y = ${result.equation[0].toFixed(2)}x + ${result.equation[1].toFixed(2)}`);
  console.log(`Coeficiente de Determinação (R²): ${result.r2.toFixed(4)}`);
}

function calculatePearsonCorrelation(data, columnX, columnY) {
  // Obter os dados das colunas X e Y
  const xData = data.map((row) => parseFloat(row[columnX])).filter((value) => !isNaN(value));
  const yData = data.map((row) => parseFloat(row[columnY])).filter((value) => !isNaN(value));

  // Certifique-se de que ambas as colunas têm o mesmo tamanho
  if (xData.length !== yData.length) {
    console.log('As colunas têm diferentes quantidades de dados.');
    return;
  }

  const n = xData.length;
  const sumX = xData.reduce((acc, curr) => acc + curr, 0);
  const sumY = yData.reduce((acc, curr) => acc + curr, 0);
  const sumXY = xData.reduce((acc, curr, index) => acc + curr * yData[index], 0);
  const sumX2 = xData.reduce((acc, curr) => acc + Math.pow(curr, 2), 0);
  const sumY2 = yData.reduce((acc, curr) => acc + Math.pow(curr, 2), 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - Math.pow(sumX, 2)) * (n * sumY2 - Math.pow(sumY, 2)));

  const correlation = numerator / denominator;

  // Exibe o resultado da correlação de Pearson
  console.log(`Coeficiente de correlação de Pearson entre "${columnX}" e "${columnY}":`);
  console.log(`r = ${correlation.toFixed(4)}`);
}
