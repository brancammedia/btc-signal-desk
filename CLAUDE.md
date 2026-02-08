# BTC Signal Desk

## Project Overview
Single-file HTML application (`index.html`) for real-time Bitcoin technical analysis. Fetches live BTCUSDT data from Binance, computes 20+ indicators from raw OHLCV, and generates actionable trade setups.

## Deployment
- **GitHub**: `brancammedia/btc-signal-desk` (public repo)
- **Live**: https://brancammedia.github.io/btc-signal-desk/
- Deploy: `git add index.html && git commit -m "msg" && git push`

## Architecture
- **Single file**: `index.html` — React 18 + Babel (JSX) + Tailwind-free custom CSS, all inline
- **CDNs**: React 18, Babel Standalone, TradingView Lightweight Charts v4, SheetJS 0.20.1, TradingView tv.js
- **No build tools** — open directly in browser

## Code Structure (inside `<script type="text/babel">`)
- **DataService**: Binance REST API with fallback endpoints (api.binance.us -> api1.binance.com -> api.binance.com), WebSocket for live price, 60s auto-refresh, paginated historical fetch back to Jan 2017
- **Ind (IndicatorEngine)**: EMA, SMA, RSI, MACD, Bollinger, ATR, ADX, Stochastic RSI, Ichimoku, VWAP, OBV, Pivot Points, Fibonacci — all from scratch
- **SMC Engine**: Swing highs/lows (5-bar), BOS, CHOCH, FVGs, Order Blocks, Liquidity Levels, Divergences
- **Confluence Scorer**: Per-timeframe scoring (-100 to +100) with ADX multiplier, weighted composite (Weekly 5x -> 15m 1x)
- **TradeGen**: Entry/SL/TP generation, position sizing, leverage, timing logic, executive summary
- **TIPS**: ~55 tooltip entries for all indicators/concepts
- **Tip**: React component using `ReactDOM.createPortal` for fixed-position tooltips with edge clamping
- **SESSIONS**: Asia/London/NY with UTC open/close times, live countdown timers
- **React Components**: Header, ChartPanel, PriceHistoryChart, TradingViewChart, ConfluenceMeter, TFPanel, FactorDetail, ExecutiveSummary, EntryTiming, TradeSetupCard, TradeJournal, KeyLevelsPanel, App

## Key Features
- 5 timeframes: 15m, 1H, 4H, Daily, Weekly
- Executive summary with timing-aware language (doesn't say "enter" when price is far from entry)
- Entry timing: ENTER NOW / SET LIMIT ORDER / WAIT FOR CONFIRMATION based on price proximity + TF alignment
- Scale-in entry ladder: 3 zones (Aggressive 25%, Target 50%, Deep 25%) with ATR-based front-run offset
- "What Changed" log tracking direction flips, strength changes, level shifts
- Session countdown timers in header (pill-style, 1s tick, glowing dot for active)

## Position Sizing Model
- **Trade Capital** = $ you're putting up (margin deposit)
- **Max Loss at SL** = most willing to lose
- **Leverage** = user selects 1x / 3x / 5x / 10x
- **Position** = Trade Capital x Leverage
- **SL Price** = Entry x (1 - MaxLoss/Position) for longs
- Higher leverage = tighter stop for same risk amount
- **Technical SL** shown as reference (from ATR, swing lows, OBs, Ichimoku)
- Warning when risk-based SL is tighter than technical SL
- **Leverage comparison table**: shows Position/SL Price/SL Loss/TP1 Gain/Liq at each level
- **% Capital column** on TP table shows return on trade capital

## Charts
- **Technical chart**: Candlestick + EMA 9/21/50 + BB + BOS/CHOCH markers, color legend
- **Price history**: Area chart, daily/weekly back to Jan 2017, paginated API fetch
- **TradingView embed**: tv.js widget (BTCUSDT 4H, dark theme, EMA/RSI/MACD), "Open My Chart" button links to user's saved chart (https://www.tradingview.com/chart/bKlJWA5U/). Free embed does NOT support save/load — resets on reload.

## Timeframe Weights
- Weekly: 5x, Daily: 4x, 4H: 3x, 1H: 2x, 15m: 1x

## Composite Score Ranges
- -100 to -60: STRONG SHORT
- -60 to -20: SHORT
- -20 to +20: NEUTRAL / NO TRADE
- +20 to +60: LONG
- +60 to +100: STRONG LONG

## Color Scheme
- Background: #0a0e17, Cards: #111827, Borders: #1e293b
- Bullish: #22c55e, Bearish: #ef4444, Accent: #3b82f6, Warning: #f59e0b
- Fonts: JetBrains Mono (prices), Outfit (headings)

## Mobile Responsive
- 768px breakpoint: `display:contents` unwraps col-left/col-right wrappers
- CSS `order` reorders modules: Chart(1) → Summary(2) → Setup(3) → Entry(4) → rest
- Tables: `white-space:normal`, `word-break:break-word`, `overflow-x:auto`
- Session pills scale down, tabs scroll horizontally

## Scalp Lab (`scalp.html`)
- **Live**: https://brancammedia.github.io/btc-signal-desk/scalp.html
- Standalone scalp trading education + live signals module
- Same tech stack: React 18 + Babel + Lightweight Charts, dark theme, same CSS vars
- **14 strategies** across 4 categories: Indicator (7), SMC (5), Session (1), Price Action (1)
  - VWAP Bounce, VWAP Band Mean Reversion, 9/21 EMA Crossover, RSI Divergence, BB Squeeze, MACD Histogram Reversal, StochRSI Reversal
  - Order Block Entry, FVG Fill, BOS Pullback, Liquidity Sweep, CHOCH Reversal
  - Kill Zone Momentum, Candlestick Pattern Scalp
- **Scalp timeframes**: 1m, 5m, 15m, 1H (TF weights: 1H=3x, 15m=2x, 5m=1.5x, 1m=1x)
- **Strategy Scanner**: Grid of all 14 strategies × 4 timeframes with live signal dots
- **Active Setups**: Top 5 highest-confidence setups with entry/SL/TP/R:R tables
- **Position Sizer**: Same Capital × Leverage model as main Signal Desk
- **Pre-Trade Checklist**: 7-item live checklist (trend, key level, confluence, session, RSI, volume, ADX)
- **Education**: Full Strategy Playbook with expandable cards — overview, how it works, entry rules, SL/TP rules, pro tips, common mistakes for each strategy
- **Risk Management Guide**: 7 rules, session timing guide, psychology DO/DON'T
- **Quick Reference**: Indicator cheat sheet, SMC cheat sheet, entry checklist
- **VWAP Bands**: Added `Ind.vwapBands()` — VWAP with 1σ and 2σ deviation bands
- **SMC tuned for scalping**: 3-bar swing lookback (vs 5-bar in main app)
- **30s refresh** (vs 60s in main app)
- Navigation: Header links between Signal Desk ↔ Scalp Lab
- **Trade Log Persistence**:
  - Dual-write: localStorage (primary) + IndexedDB (durable backup)
  - Auto-restore from IndexedDB if localStorage is empty on load
  - JSON export/import for cross-device session transfer
  - Excel import parses .xlsx back into trade log with merge
  - Merge deduplicates by trade ID and openTime+strategy+tf+dir
  - Import prompt when log is empty
- **Signal Quality Filters**:
  - Minimum 60% confidence threshold (`LOG_MIN_CONF`)
  - Direction conflict filter: only logs dominant direction (TF-weighted vote)
  - Conservative SL/TP resolution: SL wins if both hit on same 1m candle
- **Performance Analysis**:
  - $ P&L column (based on trade capital × leverage)
  - Confidence column with visual progress bar
  - Strategy Breakdown table (per-strategy W/L/Win%/P&L)
  - Confidence Bracket Breakdown (win rate by 80+/70-79/60-69/<60%)
- **Risk-Based SL**: SL = Entry × (1 - MaxLoss/Position), adjusts with leverage
  - Technical SL shown as faded reference row when different
  - Warning when risk SL is tighter than technical level
  - Leverage comparison table per setup (1x/3x/5x/10x)
- **Strategy Detection Tuning** (post-overnight test):
  - EMA MACD filter: requires BOTH positive AND growing histogram
  - StochRSI: thresholds tightened to 20/80, requires confirmation candle
  - Liquidity Sweep: conf 80→72, volume confirmation, tighter wick ratio
  - Order Block: SL 0.3→0.5 ATR, TP 2/3→1.5/2.5 ATR
  - CHOCH: TP1 now real profit level (was CHOCH trigger price)
  - Candlestick: min body size, tighter pin bar ratio, 0.2% level proximity
- **TF-Aware Expiry**: 1m=30min, 5m=2h, 15m=4h, 1h=8h (was flat 4h)
- **Minimum 50 candles** for indicator warmup (was 30)

## Known Considerations
- Binance.com blocked in US — app uses api.binance.us as primary with fallbacks
- TradingView embed widget (tv.js) does NOT support save/load — requires paid Advanced Charts library for persistence
- User's TradingView chart URL: https://www.tradingview.com/chart/bKlJWA5U/
