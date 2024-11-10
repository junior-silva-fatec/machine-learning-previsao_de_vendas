const fs = require('fs');
const csv = require('csv-parser');
const regression = require('regression');
const { RandomForestRegression } = require('ml-random-forest'); // Biblioteca Random Forest

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
    performLinearRegression(data, 'Temperature', 'Weekly_Sales');  // Regressão Linear
    calculatePearsonCorrelation(data, 'Temperature', 'Weekly_Sales'); // Correlação de Pearson
    performMarkovAnalysis(data, 'Holiday_Flag'); // Análise de Markov
    performRandomForest(data); // Regressão usando Random Forest
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

function performMarkovAnalysis(data, column) {
  // Contagem de transições entre estados
  const states = ['0', '1'];  // Supondo que os valores possíveis sejam 0 e 1 (Holiday_Flag)
  const transitions = { '0': { '0': 0, '1': 0 }, '1': { '0': 0, '1': 0 } };

  // Preenche a tabela de transições
  for (let i = 0; i < data.length - 1; i++) {
    const currentState = data[i][column];
    const nextState = data[i + 1][column];

    if (states.includes(currentState) && states.includes(nextState)) {
      transitions[currentState][nextState]++;
    }
  }

  // Normaliza a tabela de transições para obter as probabilidades
  for (let state of states) {
    const totalTransitions = transitions[state]['0'] + transitions[state]['1'];
    transitions[state]['0'] /= totalTransitions;
    transitions[state]['1'] /= totalTransitions;
  }

  // Exibe a matriz de transição
  console.log(`Matriz de transição de Markov para "${column}":`);
  console.log(`Estado atual -> [0, 1]`);
  console.log(`0 -> [${transitions['0']['0'].toFixed(2)}, ${transitions['0']['1'].toFixed(2)}]`);
  console.log(`1 -> [${transitions['1']['0'].toFixed(2)}, ${transitions['1']['1'].toFixed(2)}]`);
}

function performRandomForest(data) {
  // Preparar dados para o modelo de Random Forest
  const features = ['Temperature', 'Fuel_Price', 'CPI', 'Unemployment']; // Variáveis independentes
  const target = 'Weekly_Sales'; // Variável dependente

  // Filtrar dados e preparar as variáveis de entrada (X) e de saída (y)
  const X = data.map((row) => {
    return features.map((feature) => parseFloat(row[feature])).filter((value) => !isNaN(value));
  }).filter((row) => row.length === features.length);

  const y = data.map((row) => parseFloat(row[target])).filter((value) => !isNaN(value));

  if (X.length !== y.length) {
    console.log('O número de entradas não é compatível com o número de saídas.');
    return;
  }

  // Configurar o modelo Random Forest
  const options = {
    nEstimators: 100,  // Número de árvores na floresta
    maxFeatures: 3,    // Número máximo de características para dividir um nó
    minSamplesSplit: 2 // Número mínimo de amostras necessárias para dividir um nó
  };

  const rf = new RandomForestRegression(options);
  
  // Treinar o modelo
  rf.train(X, y);

  // Prever valores
  const predictions = rf.predict(X);
  
  // Exibir os resultados
  console.log('Resultados da previsão usando Random Forest:');
  predictions.forEach((prediction, index) => {
    console.log(`Valor real: ${y[index]}, Valor previsto: ${prediction}`);
  });
}
