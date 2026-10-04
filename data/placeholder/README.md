# Placeholder inputs — not real data

Every file in this folder carries `"status": "placeholder, unverified"`.
The values approximate the shape of European electricity history from
general knowledge, with invented detail, so that the Phase 1 simulation has
something to run on. **No third-party dataset was copied**; nothing here is
calibrated; none of it ships. Part (b) of the Phase 1 task replaces each file
with licence-checked extracts (see `docs/licences.md`), and part (c)
calibrates against Energinet's open price statistics.

| File | Holds | Replace with |
|---|---|---|
| `zones.json` | The four zones: market-opening and negative-price dates, price floor/cap, annual demand, demand-shape and weather-shape parameters, reservoir parameters | Eurostat/Ember demand, ENTSO-E load shapes, NVE reservoir statistics |
| `technologies.json` | Efficiency, emission factor, variable O&M, availability, must-run behaviour, storage parameters | DEA Technology Data, NREL ATB |
| `fuels.json` | Annual coal, gas, oil prices (€/MWh thermal) and the CO₂ price from 2005 | World Bank Pink Sheet; a licensed EUA series |
| `capacity.json` | Installed MW by zone, technology and year | Ember, powerplantmatching, national statistics |
| `links.json` | Interconnector MW by year | ENTSO-E / TSO figures |
| `support.json` | Renewable premiums paid only while producing, and the flexible share of the fleet | Tariff histories (EEG, Danish PSO, RD 661/2007) |
| `weather.json` | Correlation and persistence parameters of the synthetic weather generator | Nothing: real ERA5/PECD weather-years replace the generator |

Year-dependent values are keyframes `[[year, value], …]`, interpolated
linearly between the years given and held constant outside them; the
simulation reads the value for the integer year.
