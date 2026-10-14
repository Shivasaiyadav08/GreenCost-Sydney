"""Display helpers shared by GreenCost's generated reports."""

import math
from datetime import date


def format_water_volume(litres: float, period: str = "year") -> str:
    """Format water only in million litres, retaining precision for small values."""
    if not math.isfinite(litres):
        return f"— million litres/{period}"

    millions = litres / 1_000_000
    absolute = abs(millions)
    digits = 2 if absolute >= 0.005 or absolute == 0 else min(100, max(2, math.ceil(-math.log10(absolute)) + 1))
    amount = f"{millions:,.{digits}f}".rstrip("0").rstrip(".")
    if millions != 0 and float(amount.replace(",", "")) == 0:
        amount = f"{millions:.2e}"
    return f"{amount} million litres/{period}"


def format_number(value: float, maximum_fraction_digits: int = 1) -> str:
    """Format an Australian-style grouped number without unnecessary zeroes."""
    rendered = f"{value:,.{maximum_fraction_digits}f}"
    return rendered.rstrip("0").rstrip(".") if "." in rendered else rendered


def format_australian_date(value: str | None) -> str:
    """Render an ISO date as 30 Jun 2026 for report readers."""
    if not value:
        return "Date not stated"
    try:
        parsed = date.fromisoformat(value[:10])
    except ValueError:
        return value
    return f"{parsed.day:02d} {parsed.strftime('%b')} {parsed.year}"
