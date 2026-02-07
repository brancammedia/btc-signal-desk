# BTC Signal Desk

## Project Overview
Single-file HTML application (`index.html`) for real-time Bitcoin technical analysis. Fetches live BTCUSDT data from Binance, computes 20+ indicators from raw OHLCV, and generates actionable trade setups.

## Architecture
- **Single file**: `index.html` — React 18 + Babel (JSX) + Tailwind-free custom CSS, all inline
- **CDNs**: React 18, Babel Standalone, TradingView Lightweight Charts v4, SheetJS 0.20.1
- **No build tools** — open directly in browser

## Code Structure (inside `<script type="text/babel">`)
- **DataService**: Binance REST API with fallback endpoints (api.binance.us -> api1.binance.com -> api.binance.com), WebSocket for live price, 60s auto-refresh
- **Ind (IndicatorEngine)**: EMA, SMA, RSI, MACD, Bollinger, ATR, ADX, Stochastic RSI, Ichimoku, VWAP, OBV, Pivot Points, Fibonacci — all from scratch
- **SMC Engine**: Swing highs/lows (5-bar), BOS, CHOCH, FVGs, Order Blocks, Liquidity Levels, Divergences
- **Confluence Scorer**: Per-timeframe scoring (-100 to +100) with ADX multiplier, weighted composite (Weekly 5x -> 15m 1x)
- **TradeGen**: Entry/SL/TP generation, position sizing, leverage, timing logic, executive summary
- **React Components**: Header, ChartPanel (technical), PriceHistoryChart (simple), ConfluenceMeter, TFPanel, FactorDetail, ExecutiveSummary, EntryTiming, TradeSetupCard, TradeJournal, KeyLevelsPanel, App

## Key Features
- 5 timeframes: 15m, 1H, 4H, Daily, Weekly
- Executive summary with timing-aware language (doesn't say "enter" when price is far from entry)
- Entry timing: ENTER NOW / SET LIMIT ORDER / WAIT FOR CONFIRMATION based on price proximity + TF alignment
- Dollar P&L on trade setup (per TP and total)
- Trade Journal with Excel import/export (SheetJS), Win/Loss tracking, stats
- Journal auto-saves to localStorage, Excel file is permanent record
- Two charts: technical (candlestick + EMAs + BB + BOS/CHOCH) and simple price history (area)
- Session awareness (Asia/London/NY)

## Timeframe Weights
- Weekly: 5x, Daily: 4x, 4H: 3x, 1H: 2x, 15m: 1x

## Composite Score Ranges
- -100 to -60: STRONG SHORT
- -60 to -20: SHORT
- -20 to +20: NEUTRAL / NO TRADE
- +20 to +60: LONG
- +60 to +100: STRONG LONG

## Timing Logic
- Price >0.5% from entry: SET LIMIT ORDER
- Price <0.3% from entry + TFs aligned: ENTER NOW
- Price near but TFs not aligned: WAIT FOR CONFIRMATION

## Color Scheme
- Background: #0a0e17, Cards: #111827, Borders: #1e293b
- Bullish: #22c55e, Bearish: #ef4444, Accent: #3b82f6, Warning: #f59e0b
- Fonts: JetBrains Mono (prices), Outfit (headings)

## Known Considerations
- Binance.com blocked in US — app uses api.binance.us as primary with fallbacks
- First trade signal was directionally correct, entry missed by ~$200 (potential for entry offset feature)
