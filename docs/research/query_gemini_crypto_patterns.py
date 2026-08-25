"""One-shot Gemini Google Search-grounded research collector.
Reads the active Hermes .env but never prints secrets.
"""
from __future__ import annotations

import concurrent.futures
import json
import pathlib
import re
import urllib.request

ENV_PATH = pathlib.Path(r"C:/Users/Junsung/AppData/Local/hermes/.env")
OUTPUT_PATH = pathlib.Path(
    r"C:/Users/Junsung/Desktop/app-dev/docs/research/"
    "v1.0_crypto_chart_patterns_gemini_research_raw.json"
)


def get_key() -> str:
    text = ENV_PATH.read_text(encoding="utf-8-sig", errors="ignore")
    for name in ("GOOGLE_API_KEY", "GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"):
        match = re.search(
            rf"(?m)^\s*(?:export\s+)?{re.escape(name)}\s*=\s*(.+?)\s*$", text
        )
        if match:
            value = match.group(1).strip().strip('"').strip("'")
            if value and not value.startswith("#"):
                return value
    raise RuntimeError("No active Gemini API key found")


COMMON = """
You are a research analyst preparing evidence for a Korean crypto-trading education report.
Use Google Search grounding aggressively. Return Korean, concise but source-dense.
Separate: (1) confirmed claims and primary/academic/official sources,
(2) practitioner claims, (3) claims that lack usable evidence.
For every material assertion include the exact source URL and title.
Do not invent win rates, backtests, traders, or quotations.
Explain that pattern outcome is conditional on market regime, sample definition,
entry/stop/target. This is educational research, not trade advice.
"""

PROMPTS = {
    "empirical": COMMON
    + """
Task: Find empirical studies (peer-reviewed papers, preprints, exchange data analyses)
testing technical-analysis/chart-pattern profitability specifically in Bitcoin/crypto,
plus high-quality broader market chart-pattern evidence that transfers only cautiously.
Extract sample period, asset/market, tested pattern/rule, method, headline result,
and limitations. Prioritize original papers/DOIs/SSRN/arXiv/working papers over blog summaries.
""",
    "classical": COMMON
    + """
Task: Map the major classical chart/price-action patterns usable in liquid crypto:
trend pullback, breakout-retest, range mean-reversion, ascending/descending triangle,
flag/pennant, double top/bottom, head-and-shoulders, cup-and-handle, support/resistance.
For each, identify a reputable original educator/book author or trading source,
operational trigger, invalidation, and whether a published statistical performance claim
is independently verifiable. Include Thomas Bulkowski and Adam Grimes only where source-supported.
""",
    "crypto_traders": COMMON
    + """
Task: Identify prominent crypto traders/educators whose public materials explain repeatable
chart setups—not price calls—and gather direct materials. Candidates include Rekt Capital,
CryptoCred, DonAlt, Cred/TraderSZ, TheChartGuys, Scott Melker, and Cheds; verify their
relevance rather than assuming it. Extract their stated setup/confirmation/risk-management
ideas with direct URL, and distinguish personal framework from evidence of edge.
""",
    "breakout_volume": COMMON
    + """
Task: Deep dive into breakout, breakout-retest, trend continuation/pullback, and volume
confirmation in Bitcoin/altcoin markets. Search for research, exchange education, and
respected traders. Identify conditions likely to reduce false breakouts: timeframe alignment,
close vs wick, volume/participation, retest, volatility/regime filters, liquidity.
Report any trustworthy hit-rate or expectancy estimate only with exact backtest definition and link.
""",
    "reversal_range": COMMON
    + """
Task: Deep dive into reversals and range patterns for liquid crypto: double tops/bottoms,
head-and-shoulders, failed breakouts, liquidity sweep/swing failure, support-resistance range
reversion, Wyckoff accumulation/distribution. Find strongest support and major failure modes.
State whether any claimed win rate is reproducible/independently supported.
Include rules that prevent narrative overfitting.
""",
    "risk_framework": COMMON
    + """
Task: Search for the most defensible framework to evaluate whether a chart pattern has an edge
in crypto. Cover sample size, out-of-sample backtests, survivorship/selection bias,
transaction costs/slippage/funding, multiple testing, regime changes, position sizing,
R-multiples and expectancy. Find credible sources and formulate a simple pattern scorecard
appropriate for a retail trader.
""",
}


def call(name: str, prompt: str, url: str) -> tuple[str, dict]:
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "tools": [{"google_search": {}}],
        "generationConfig": {"temperature": 0.15, "maxOutputTokens": 12000},
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=240) as response:
            response_data = json.load(response)
        candidate = (response_data.get("candidates") or [{}])[0]
        response_text = "".join(
            part.get("text", "") for part in candidate.get("content", {}).get("parts", [])
        )
        return name, {
            "ok": True,
            "model": "gemini-2.5-flash",
            "finishReason": candidate.get("finishReason"),
            "text": response_text,
            "grounding": candidate.get("groundingMetadata", {}),
        }
    except Exception as exc:  # Preserve per-topic failures for a transparent report.
        return name, {"ok": False, "error": repr(exc)}


def main() -> None:
    key = get_key()
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={key}"
    )
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        pairs = list(executor.map(lambda kv: call(kv[0], kv[1], url), PROMPTS.items()))
    results = dict(pairs)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    for name, data in results.items():
        source_count = len(data.get("grounding", {}).get("groundingChunks", []))
        print(
            f"{name}: {'OK' if data.get('ok') else 'FAIL'} | "
            f"finish={data.get('finishReason', '')} | "
            f"chars={len(data.get('text', ''))} | sources={source_count}"
        )
    print(f"WROTE {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
