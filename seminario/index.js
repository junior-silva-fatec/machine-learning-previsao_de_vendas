const dfd = require("danfojs-node"); // Biblioteca para carregar e manipular dados
const fs = require("fs");

// Função para ler e processar o arquivo CSV
async function loadData() {
    let df = await dfd.readCSV("Walmart_Store_sales.csv");
    return df;
}

// Função para definir estados de vendas automaticamente com base nos quartis dos dados
function categorizeSales(sales, lowThreshold, mediumThreshold) {
    if (sales < lowThreshold) return "low";
    else if (sales < mediumThreshold) return "medium";
    else return "high";
}

// Função para calcular os thresholds de categorização
function calculateThresholds(df) {
    const salesValues = df['Weekly_Sales'].values; // Obtém os valores de 'Weekly_Sales' como um array
    salesValues.sort((a, b) => a - b); // Ordena para calcular os quartis

    const lowThreshold = salesValues[Math.floor(salesValues.length * 0.33)]; // Limite do 1º tercil
    const mediumThreshold = salesValues[Math.floor(salesValues.length * 0.66)]; // Limite do 2º tercil

    return { lowThreshold, mediumThreshold };
}

// Função para construir a matriz de transição
function buildTransitionMatrix(data, states) {
    let matrix = {};
    states.forEach((state) => (matrix[state] = {}));

    // Inicializar contagem de transições
    for (let i = 0; i < data.length - 1; i++) {
        let current = data[i];
        let next = data[i + 1];
        if (!matrix[current]) matrix[current] = {};
        if (!matrix[current][next]) matrix[current][next] = 0;
        matrix[current][next]++;
    }

    // Converter contagens em probabilidades
    Object.keys(matrix).forEach((state) => {
        let total = Object.values(matrix[state]).reduce((sum, val) => sum + val, 0);
        Object.keys(matrix[state]).forEach((nextState) => {
            matrix[state][nextState] /= total;
        });
    });

    return matrix;
}

// Função de previsão usando a cadeia de Markov
function predict(matrix, initialState, steps) {
    let state = initialState;
    for (let i = 0; i < steps; i++) {
        let probs = matrix[state];
        let rand = Math.random();
        let cumulative = 0;
        for (let nextState in probs) {
            cumulative += probs[nextState];
            if (rand <= cumulative) {
                state = nextState;
                break;
            }
        }
    }
    return state;
}

// Função de avaliação
function calculateAccuracy(predictions, actuals) {
    let correct = 0;
    for (let i = 0; i < predictions.length; i++) {
        if (predictions[i] === actuals[i]) correct++;
    }
    return correct / predictions.length;
}

// Função para calcular o coeficiente de correlação de Pearson entre vendas e outras variáveis
function calculatePearson(df) {
    let pearsonResults = {};
    const variables = ["Fuel_Price", "Unemployment", "Holiday_Flag", "CPI"];
    
    variables.forEach((variable) => {
        const weeklySales = df["Weekly_Sales"].values;
        const otherVariable = df[variable].values;

        // Cálculo manual do coeficiente de correlação de Pearson
        const n = weeklySales.length;
        const meanSales = weeklySales.reduce((a, b) => a + b, 0) / n;
        const meanVar = otherVariable.reduce((a, b) => a + b, 0) / n;

        const numerator = weeklySales.reduce((sum, sales, i) => sum + (sales - meanSales) * (otherVariable[i] - meanVar), 0);
        const denominatorSales = Math.sqrt(weeklySales.reduce((sum, sales) => sum + Math.pow(sales - meanSales, 2), 0));
        const denominatorVar = Math.sqrt(otherVariable.reduce((sum, varValue) => sum + Math.pow(varValue - meanVar, 2), 0));

        const pearsonCoefficient = numerator / (denominatorSales * denominatorVar);
        pearsonResults[variable] = pearsonCoefficient;
    });

    return pearsonResults;
}

// Função principal para execução
async function main() {
    let df = await loadData();

    // Calcular limites para categorização
    const { lowThreshold, mediumThreshold } = calculateThresholds(df);

    // Aplicar a função de categorização e converter para um array JavaScript
    let salesStates = df['Weekly_Sales'].values.map(sales => categorizeSales(sales, lowThreshold, mediumThreshold));

    let matrix = buildTransitionMatrix(salesStates, ["low", "medium", "high"]);

    let predictions = [];
    let actuals = salesStates.slice(1); // Valores reais para comparação

    for (let i = 0; i < actuals.length; i++) {
        let pred = predict(matrix, salesStates[i], 1);
        predictions.push(pred);
    }

    let accuracy = calculateAccuracy(predictions, actuals);
    console.log(`Acurácia do modelo: ${(accuracy * 100).toFixed(2)}%`);

    // Calculando e exibindo a correlação de Pearson entre vendas e variáveis
    const pearsonResults = calculatePearson(df);
    console.log("Correlação de Pearson com 'Weekly_Sales':", pearsonResults);
}

// Executa o script
main();
