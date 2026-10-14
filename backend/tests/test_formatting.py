from backend.app.services.formatting import format_australian_date, format_number, format_water_volume


def test_water_volume_uses_one_unit_and_keeps_small_values_visible():
    assert format_water_volume(200_000) == "0.2 million litres/year"
    assert format_water_volume(1_500_000) == "1.5 million litres/year"
    assert format_water_volume(20_000) == "0.02 million litres/year"
    assert format_water_volume(1_000) == "0.001 million litres/year"
    assert format_water_volume(0) == "0 million litres/year"
    assert "e-" in format_water_volume(1e-120)


def test_australian_date_and_area_number_formatting():
    assert format_australian_date("2026-06-30") == "30 Jun 2026"
    assert format_number(250.0) == "250"
    assert format_number(1234.5) == "1,234.5"
