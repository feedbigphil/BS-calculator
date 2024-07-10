from flask import Flask, jsonify, request
import yfinance as yf
from flask_cors import CORS
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

@app.route('/api/stock-data/<ticker>', methods=['GET'])
def get_stock_data(ticker):
    stock = yf.Ticker(ticker)
    summary = stock.info

    response = {
        'price': summary.get('regularMarketPreviousClose', 'N/A'),
        'pe': summary.get('trailingPE', 'N/A'),
        'eps': summary.get('trailingEps', 'N/A'),
        'beta': summary.get('beta', 'N/A'),
        'volume': summary.get('volume', 'N/A'),
        'marketCap': summary.get('marketCap', 'N/A'),
        'ebitda': summary.get('ebitda', 'N/A'),
        'pBook': summary.get('priceToBook', 'N/A'),
        'pSales': summary.get('priceToSalesTrailing12Months', 'N/A'),
        'high': summary.get('fiftyTwoWeekHigh', 'N/A')
    }
    return jsonify(response)

@app.route('/api/stock-history/<ticker>', methods=['GET'])
def get_stock_history(ticker):
    try:
        stock = yf.Ticker(ticker)
        history = stock.history(period="max")
        
        if history.empty:
            return jsonify({'error': f"No history data found for {ticker}"}), 404
        
        history['Date'] = history.index.strftime('%Y-%m-%d %H:%M:%S')

        # Convert DataFrame to JSON-serializable dictionary
        history_json = {
            'timestamp': history['Date'].tolist(),  # Convert Unix timestamps to seconds
            'open': history['Open'].tolist(),
            'high': history['High'].tolist(),
            'low': history['Low'].tolist(),
            'close': history['Close'].tolist(),
            'volume': history['Volume'].tolist()
        }

        return jsonify(history_json), 200
    
    except Exception as e:
        print(f"Error fetching stock history for {ticker}: {str(e)}")
        print(history)
        return jsonify({'error': f"Failed to fetch stock history for {ticker}"}), 500

@app.route('/api/stock-options/<ticker>', methods=['GET'])
def get_stock_options(ticker):
    try:
        stock = yf.Ticker(ticker)
        options_expirations = stock.options
        options_data = {}

        for expiration in options_expirations:
            options = stock.option_chain(expiration)
            calls = options.calls.replace([np.nan, pd.NA], None).to_dict(orient='records')
            puts = options.puts.replace([np.nan, pd.NA], None).to_dict(orient='records')
            options_data[expiration] = {
                'calls': calls,
                'puts': puts
            }

        return jsonify(options_data), 200
    
    except Exception as e:
        print(f"Error fetching options data for {ticker}: {str(e)}")
        return jsonify({'error': f"Failed to fetch options data for {ticker}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
