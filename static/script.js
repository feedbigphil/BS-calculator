let myChart = null;
const baseUrl = 'https://bscalculator-428906.ts.r.appspot.com';

// Function to calculate the Black-Scholes Call and Put option prices
function calculateBlackScholes(stockPrice, strikePrice, expiration, volatility, riskFree) {
    const S = parseFloat(stockPrice);
    const K = parseFloat(strikePrice);
    const T = parseFloat(expiration);
    const sigma = parseFloat(volatility) / 100;
    const r = parseFloat(riskFree) / 100;

    const d1 = (Math.log(S / K) + (r + Math.pow(sigma, 2) / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const callPrice = S * jStat.normal.cdf(d1, 0, 1) - K * Math.exp(-r * T) * jStat.normal.cdf(d2, 0, 1);
    const putPrice = K * Math.exp(-r * T) * jStat.normal.cdf(-d2, 0, 1) - S * jStat.normal.cdf(-d1, 0, 1);

    return { callPrice, putPrice, d1 };
}

// Event listener for the buttons
document.addEventListener("DOMContentLoaded", function() {


    document.querySelector("#calculateButton").addEventListener("click", function() {
        const stockPrice = document.getElementById("stockPrice").value;
        const strikePrice = document.getElementById("strikePrice").value;
        const expiration = document.getElementById("expiration").value;
        const volatility = document.getElementById("volatility").value;
        const riskFree = document.getElementById("riskFree").value;

        const prices = calculateBlackScholes(stockPrice, strikePrice, expiration, volatility, riskFree);

        document.getElementById("callPrice").textContent = "Call price: $" + prices.callPrice.toFixed(2);
        document.getElementById("putPrice").textContent = "Put price: $" + prices.putPrice.toFixed(2);
        document.getElementById("delta").textContent = "Delta: " + prices.d1.toFixed(2);
        
    });

    document.querySelector("#searchButton").addEventListener("click", function() {
        const ticker = document.getElementById("tickerSymbol").value;
        if(ticker) {
            fetchStockData(ticker).then(data => {
                updateDashboard(data);
                return fetchStockHistory(ticker);
            }).then(history => {
                updateChart(history);
                return fetchStockOptions(ticker); // Fetch options after fetching historical data
            }).then(options => {
                displayOptions(options); // Display options market depth
            }).catch(error => console.error('Error fetching data:', error));
        } else {
        alert("Please enter a valid ticker symbol.");
        }
    });

    // Toggle the Black-Scholes explanation section
    document.querySelector("#toggleBlackScholesExplanation").addEventListener("click", function() {
        const explanation = document.getElementById("blackScholesExplanation");
        if (explanation.style.display === "none") {
            explanation.style.display = "block";
        } else {
            explanation.style.display = "none";
        }
    });
});

async function fetchStockOptions(ticker) {
    try {
        const response = await fetch(`${baseUrl}/stock-options/${ticker}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching stock options:', error);
        return null;
    }
}


// Modify the displayOptions function to include dropdown functionality
function displayOptions(options) {
    const optionsContainer = document.getElementById('options-container');
    const expirationSelect = document.getElementById('expirationSelect');
    expirationSelect.innerHTML = ''; // Clear previous options

    if (!options) {
        optionsContainer.textContent = 'Failed to fetch options data.';
        return;
    }

    // Populate expiration dates in the dropdown
    Object.keys(options).forEach(expiration => {
        const option = document.createElement('option');
        option.value = expiration;
        option.textContent = expiration;
        expirationSelect.appendChild(option);
    });

    // Event listener for dropdown change
    expirationSelect.addEventListener('change', function() {
        const selectedExpiration = this.value;
        renderOptionsForExpiration(options[selectedExpiration]);
    });

    // Initial render for the first expiration date
    const initialExpiration = Object.keys(options)[0];
    renderOptionsForExpiration(options[initialExpiration]);
}

// Function to render calls and puts for a specific expiration date
function renderOptionsForExpiration(expirationData) {
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = ''; // Clear previous options

    ['calls', 'puts'].forEach(type => {
        const typeHeader = document.createElement('h4');
        typeHeader.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        optionsContainer.appendChild(typeHeader);

        const table = document.createElement('table');
        table.className = 'options-table';

        const headers = Object.keys(expirationData[type][0]);
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            let headerText = header;
            // Customize header text as needed
            switch (header) {
                case 'ask':
                    headerText = 'Ask Price';
                    break;
                case 'bid':
                    headerText = 'Bid Price';
                    break;
                case 'change':
                    headerText = 'Change';
                    break;
                case 'contractSize':
                    headerText = 'Contract Size';
                    break;
                case 'contractSymbol':
                    headerText = 'Contract Symbol';
                    break;
                case 'currency':
                    headerText = 'Currency';
                    break;
                case 'impliedVolatility':
                    headerText = "Implied Volatility (100's %)";
                    break;
                case 'inTheMoney':
                    headerText = 'In The Money';
                    break;
                case 'lastPrice':
                    headerText = 'Last Price';
                    break;
                case 'lastTradeDate':
                    headerText = 'Last Trade Date';
                    break;
                case 'openInterest':
                    headerText = 'Open Interest';
                    break;
                case 'percentChange':
                    headerText = 'Percent Change';
                    break;
                case 'strike':
                    headerText = 'Strike Price';
                    break;
                case 'volume':
                    headerText = 'Volume';
                    break;
                // Add more cases for other headers as needed
                default:
                    break;
            }
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        expirationData[type].forEach(option => {
            const row = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = option[header];
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        optionsContainer.appendChild(table);
    });
}
async function fetchStockData(ticker) {
    try {
        const response = await fetch(`${baseUrl}/stock-data/${ticker}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching stock data:', error);
        return null;
    }
}

async function fetchStockHistory(ticker) {
    try {
        const response = await fetch(`${baseUrl}/api/stock-history/${ticker}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching stock history:', error);
        return null;
    }
}

function updateDashboard(data) {
    document.getElementById("price").textContent = "Previous close: " + data.price;
    document.getElementById("pe").textContent = "PE ratio (TTM): " + data.pe;
    document.getElementById("eps").textContent = "EPS (TTM): " + data.eps;
    document.getElementById("beta").textContent = "Beta: " + data.beta;
    document.getElementById("volume").textContent = "Volume: " + data.volume;
    document.getElementById("marketCap").textContent = "Market cap: " + data.marketCap;
    document.getElementById("ebitda").textContent = "EBITDA: " + data.ebitda;
    document.getElementById("pBook").textContent = "Price/book (mrq): " + data.pBook;
    document.getElementById("pSales").textContent = "Price/sales (ttm): " + data.pSales;
    document.getElementById("high").textContent = "52-week high: " + data.high;
}

const chartjsAdapterDate = window.chartjsAdapterDate;
function updateChart(history) {
    if (!history || !history.timestamp || !history.close) {
        console.error('Invalid chart data');
        return;
    }
    const ctx = document.getElementById('myChart').getContext('2d');

    // Destroy existing chart instance if it exists
    if (myChart) {
        myChart.destroy();
    }
    
    const timestamps = history.timestamp.map(ts => new Date(ts)); // Assuming history.timestamp contains string dates
    const closePrices = history.close;

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [{
                label: 'Stock Price',
                data: closePrices,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            plugins: {
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                        event: {
                            passive: true
                        }
                        
                    },
                    pan: {
                        enabled: false,
                        mode: 'xy'
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        tooltipFormat: 'MMM d, yyyy', // Format for tooltip (e.g., 'MMM D, YYYY')
                        displayFormats: {
                            day: 'MMM d, yyyy'// Format for display on x-axis (e.g., 'Jan 1, 2023')
                        }
                    }
                },
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}
