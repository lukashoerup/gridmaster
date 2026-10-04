# Data Sources and Modelling Approaches for Gridmaster (weather, renewable output, demand, prices, 1990 to today and beyond)

> **How these notes were verified (please read).** In this session the network egress proxy blocked WebFetch for nearly every target domain: renewables.ninja, ember-energy.org, ENTSO-E, OPSD, Copernicus/ECMWF, Zenodo, Wikipedia, RePEc, energidataservice.dk, globalwindatlas.info and globalsolaratlas.info. Only raw.githubusercontent.com could be reached, and the shared WebSearch budget ran out partway through.
> - Items tagged **[fetched]** were read first-hand from the primary file.
> - All other licence statements are **search-engine extracts of the cited primary page**, quoted as returned. Before anything ships, a human should re-check them against the live licence page.
> - Items tagged **[calc]** are my own arithmetic.
> - Items tagged **[unverified]** are background knowledge that could not be checked this session. They appear only under Inferences or Gaps.
>
> None of this is legal advice. Today's date is 2026-10-04.

## 1. Weather and renewable output: ERA5, Renewables.ninja, PVGIS, EMHIRES, C3S energy indicators / PECD, Global Wind Atlas, Global Solar Atlas, MERRA-2

### Takeaway
Since 2 July 2025, ERA5 and the other Copernicus Climate Data Store (CDS) products are licensed CC BY 4.0. That makes Copernicus the commercially clean backbone for hourly European weather and for the ready-made energy layers built on it: PECD 4.2 (1950–2024, hourly, 0.25°, with wind/solar capacity factors and hydro inflows, plus future climate-projection years). Renewables.ninja's downloadable data is **CC BY-NC 4.0**, so it can't be shipped in a commercial game without a separate deal. Its PV model (GSEE) and wind model (VWF), however, are **BSD-3-Clause**, so the developer can rebuild "ninja-style" profiles from ERA5 themselves. Global Wind Atlas and Global Solar Atlas are CC BY 4.0 long-term maps that describe how good a site is. They are not hourly time series.

### Cited Findings
**Renewables.ninja**
- Licence: "The license for all data downloaded from Renewables.ninja is Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)". The data may be copied, redistributed and adapted "for non-commercial purposes, provided you give appropriate credit… if you wish to use the data for commercial purposes, please contact us." — [Renewables.ninja downloads](https://renewables.ninja/downloads); [Renewables.ninja about](https://www.renewables.ninja/about) (search extract)
- The wind simulations behind Renewables.ninja come from the Virtual Wind Farm (VWF) model, an R tool driven by NASA MERRA-2 hourly single-level winds (product M2T1NXSLV: DISPH, U2M/V2M, U10M/V10M, U50M/V50M), with configurable bias correction of the reanalysis wind speeds. Code licence: "BSD 3-Clause License Copyright (C) 2012-2017 Iain Staffell". The `power_curves` folder is excluded and stays under its original copyright holders. Citation: Staffell & Pfenninger (2016), *Energy* 114, 1224–1239, doi:10.1016/j.energy.2016.08.068. — [VWF README [fetched]](https://raw.githubusercontent.com/renewables-ninja/vwf/master/README.md)
- The PV model GSEE computes PV output from irradiance, for single sites (pandas) or large spatial grids (xarray). Licence "BSD-3-Clause". Citation: Pfenninger & Staffell (2016), "Long-term patterns of European PV output using 30 years of validated hourly reanalysis and satellite data", *Energy* 114, 1251–1265, doi:10.1016/j.energy.2016.08.060. — [GSEE README [fetched]](https://raw.githubusercontent.com/renewables-ninja/gsee/master/README.md)

**ERA5 and the Copernicus licence**
- "On July 2, 2025, the License to use Copernicus Products in the Climate Data Store (CDS) was replaced with the Creative Commons Attribution License (CC-BY)". ERA5 is now distributed under CC BY 4.0, which permits use, sharing, adaptation and redistribution, including commercially. Conditions: credit to C3S/ECMWF and the dataset authors, a link to the licence, and an indication of modifications. — [ECMWF forum: "CC-BY licence to replace Licence to use Copernicus Products on 02 July 2025"](https://forum.ecmwf.int/t/cc-by-licence-to-replace-licence-to-use-copernicus-products-on-02-july-2025/13464) (search extract)
- Notice wording returned in the same extract: "Generated using Copernicus Climate Change Service data [Year] under a Creative Commons Attribution 4.0 International (CC BY 4.0). https://creativecommons.org/licenses/by/4.0/". The exact wording still needs confirming on the dataset's licence tab. — [ECMWF forum](https://forum.ecmwf.int/t/cc-by-licence-to-replace-licence-to-use-copernicus-products-on-02-july-2025/13464) (search extract)
- PyPSA-Eur's own data inventory, not yet updated for the change, still lists its ERA5 + SARAH-3 "cutout" as "Copernicus Licence (ERA5), CM SAF data policy (SARAH-3)". SARAH-3 satellite irradiance (EUMETSAT CM SAF) therefore has its own data policy, separate from Copernicus. — [PyPSA-Eur data inventory [fetched]](https://raw.githubusercontent.com/PyPSA/pypsa-eur/master/doc/data_inventory.csv)

**C3S energy indicators and PECD (Pan-European Climate Database)**
- The CDS dataset "Climate and energy indicators for Europe from 1979 to present derived from reanalysis" contains:
  - climate indicators: air temperature, precipitation, incoming solar radiation, wind speed at 10 m and 100 m, mean sea-level pressure;
  - energy indicators: electricity demand, and power generation from wind (onshore and offshore), solar, and hydro (run-of-river and reservoir).
  - Resolution is national, regional (NUTS0/NUTS2 2016) or a ~30×30 km grid, with offshore variables on maritime regions MAR0/MAR1, at hourly time steps. — [CDS sis-energy-derived-reanalysis](https://cds.climate.copernicus.eu/datasets/sis-energy-derived-reanalysis) (search extract)
- That European dataset "is now superseded by the new much improved global climate and energy indicators dataset". Its updates were planned to stop on 1 July 2026, with deprecation at end-2026. The successor is "Global climate and energy indicators from 1950 to present derived from reanalysis". A sister dataset covers "Climate and energy indicators for Europe from 2005 to 2100 derived from climate projections". — [CDS sis-energy-derived-reanalysis](https://cds.climate.copernicus.eu/datasets/sis-energy-derived-reanalysis); [ECMWF forum: new global dataset](https://forum.ecmwf.int/t/new-datasets-published-in-cds-global-climate-and-energy-indicators-from-1950-to-present-derived-from-reanalysis/15026); [CDS sis-energy-global-reanalysis](https://cds.climate.copernicus.eu/datasets/sis-energy-global-reanalysis); [CDS sis-energy-derived-projections](https://cds.climate.copernicus.eu/datasets/sis-energy-derived-projections) (search extracts)
- PECD: "planned, designed, and produced by the Copernicus Climate Change Service (C3S) in collaboration with" ENTSO-E.
  - PECD 4.2 has historical data from ERA5 covering 1950–2024 at 0.25°×0.25° and 1-hour resolution.
  - Variables include temperature, precipitation, wind speed, wind and solar capacity factors, and hydropower inflows and generation, "for both historical and future periods".
  - Formats: NetCDF for gridded indicators, CSV for area-averaged ones. Hosted on the CDS. — [CDS sis-energy-pecd](https://cds.climate.copernicus.eu/datasets/sis-energy-pecd); [C3S PECD 4.2 training intro, 30 Jun 2025](https://climate.copernicus.eu/sites/default/files/custom-uploads/PECD4.2-Training/PECD4.2_training_intro_dataset_30.06.2025.pdf); [Copernicus energy hub: PECD update](https://energy.hub.copernicus.eu/pan-european-climate-database-update-what-it-means-users-energy-sector) (search extracts)

**PVGIS (JRC)**
- PVGIS data "is free for public use if the source is acknowledged (PVGIS © European Communities, 2001-2026)". Hourly radiation and PV-power series for long periods can be downloaded. — [PVGIS hourly radiation tool](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/pvgis-5-tools/hourly-radiation_en); [PVGIS geospatial data download](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/general-information/geospatial-data-download_en) (search extract; no explicit commercial-use sentence was seen)
- PyPSA-Eur tags European Commission datasets with "Reuse policy following 2011/833/EU" (the Commission's document-reuse decision) or with CC-BY-4.0. Examples: JRC ENSPRESO potentials (2010–2050) are CC-BY-4.0, and JRC-IDEES is CC-BY-4.0. — [PyPSA-Eur data inventory [fetched]](https://raw.githubusercontent.com/PyPSA/pypsa-eur/master/doc/data_inventory.csv)

**EMHIRES (JRC)**
- Wind: hourly generation for 30 years (1986–2015), "taking into account the existing wind fleet at the end of 2015". Given per country (onshore and offshore), per bidding zone, and per NUTS1 and NUTS2 region, as capacity factors.
- Solar: hourly generation series for the meteorological conditions of 1986–2015.
- Mirrored on the JRC data catalogue and on Zenodo. — [SETIS: EMHIRES part I wind](https://setis.ec.europa.eu/emhires-dataset-part-i-wind-power-generation_en); [JRC catalogue: wind](https://data.jrc.ec.europa.eu/dataset/jrc-emhires-wind-generation-time-series); [JRC catalogue: solar](https://data.jrc.ec.europa.eu/dataset/jrc-emhires-solar-generation-time-series); [Zenodo record 8340501](https://zenodo.org/records/8340501) (search extracts)

**Global Wind Atlas (GWA)**
- "licensed under the Creative Commons Attribution 4.0 International license (CC BY 4.0)".
- Required attribution: "[Data/information/map obtained from the] Global Wind Atlas 3.0, a free, web-based application developed, owned and operated by the Technical University of Denmark (DTU). The Global Wind Atlas 3.0 is released in partnership with the World Bank Group, utilizing data provided by Vortex, using funding provided by the Energy Sector Management Assistance Program (ESMAP)". — [World Bank data catalog: GWA](https://datacatalog.worldbank.org/search/dataset/0038957/global-wind-atlas); [GEE community catalog: GWA](https://gee-community-catalog.org/projects/gwa/) (search extracts)

**Global Solar Atlas (GSA)**
- Maps are "licensed by The World Bank under the Creative Commons Attribution license (CC BY 4.0) with the mandatory and binding addition presented in Global Solar Atlas terms".
- Attribution: "© 2020 The World Bank, Source: Global Solar Atlas 2.0, Solar resource data: Solargis".
- GSA was developed under contract by Solargis and is published by the World Bank/ESMAP. — [Solargis GSA map downloads](https://solargis.com/maps-and-gis-data/download/world); [World Bank data catalog: GSA](https://datacatalog.worldbank.org/search/dataset/0038509); [Wikipedia: Global Solar Atlas](https://en.wikipedia.org/wiki/Global_Solar_Atlas) (search extracts)

**MERRA-2**
- NASA GMAO's third-generation global reanalysis. It starts in 1980, has 0.625° × 0.5° resolution, and is distributed by NASA GES DISC. — [NASA GMAO MERRA-2](https://gmao.gsfc.nasa.gov/reanalysis/merra-2/) (search extract)

**Conversion tooling**
- atlite is "a free software, xarray-based Python library for converting weather data (like wind speeds, solar influx) into energy systems data": wind and solar capacity factors, heat demand and hydro inflow. Licensing: "All original source code is licensed under MIT… The documentation is licensed under CC-BY-4.0. Configuration and data files are mostly licensed under CC0-1.0." — [atlite README [fetched]](https://raw.githubusercontent.com/PyPSA/atlite/master/README.rst)

### Inferences
- **Commercially clean pipeline:**
  1. Start from ERA5, or from the derived PECD 4.2 / C3S global energy indicators (now also under CDS CC BY).
  2. Compute capacity factors offline with BSD/MIT code (GSEE, VWF logic, atlite).
  3. Aggregate to the game's zones.
  4. Ship only the derived series, crediting C3S/ECMWF.

  Renewables.ninja downloads should stay a development-time validation reference unless a commercial licence is negotiated.
- **Raw ERA5 cannot be shipped [calc].** A 34–72°N, 25°W–45°E box at 0.25° is about 43,000 cells. Six variables, hourly, over 45 years come to about 407 GB as float32, or about 203 GB packed as int16. Preprocessing therefore has to happen offline.
- **Aggregated series ship easily [calc].** For 40 zones × 5 hourly series (onshore wind, offshore wind, solar, hydro inflow, temperature):

  | Weather-years | 1 byte per value | float16 |
  |---|---|---|
  | 30 | ≈53 MB | ≈105 MB |
  | 45 (1980–2024) | ≈79 MB | ≈158 MB |
  | 75 (1950–2024, PECD span) | ≈131 MB | ≈263 MB |

  A finer layer of about 300 NUTS2-like regions × 3 series × 45 years is about 355 MB at 1 byte per value. All of these sizes are fine for Steam, before compression.
- **PECD 4.2 looks the most "game-ready" source.** It is ENTSO-E's own climate-year database, with capacity factors already computed. It provides 75 historical weather-years plus climate-projection years, which directly supports "plausible future" weather. Its post-July-2025 licence is probably plain CC BY 4.0 like the rest of the CDS, but that must be confirmed on its licence tab.
- **The European C3S indicator set is being retired.** Its updates were scheduled to stop on 1 July 2026, already past, and it is deprecated at end-2026. Build on PECD or the global 1950–present indicators instead.
- **Use GWA/GSA only as a site-quality layer.** They are climatologies (long-term means) at high spatial resolution. They fit a map mechanic where one ridge is better than the next: scale a zone's hourly ERA5 shape by the local long-term mean. They cannot supply hourly dynamics.
- **EMHIRES needs reworking for early decades.** Its "fleet at end-2015" assumption bakes 2015 turbines into its capacity factors. For 1990s turbines (lower hubs, older power curves) the game should recompute capacity factors with era-appropriate power curves rather than reuse EMHIRES directly.
- **Reanalysis winds need bias correction** (VWF does this). Any home-built wind model should be calibrated against observed national fleet output, for example ENTSO-E or Energinet data, during development.

### Gaps
- **EMHIRES licence:** the exact text was not retrieved. JRC data is usually CC BY 4.0 under Decision 2011/833/EU, but this is unverified for EMHIRES.
- **PVGIS:** there is no explicit "commercial use permitted" sentence, only "free for public use if the source is acknowledged". The PVGIS FAQ or legal notice needs checking. The PVGIS hourly data periods (e.g. SARAH-3 / ERA5 coverage years) were not verified.
- **Global Solar Atlas:** the content of its "mandatory and binding addition" could not be read (domain blocked). This must be checked before shipping any GSA-derived layer.
- **MERRA-2 licence:** NASA Earth-science data is generally released without restrictions [unverified], but no primary quote was obtained.
- **ERA5 and PECD details:**
  - ERA5's back-extension to 1940 was not verified.
  - The exact CC BY attribution wording on the CDS was not verified.
  - Whether PECD 4.2 and the global energy indicators carry dataset-specific terms or third-party components was not verified.
- **Resolutions:** GWA (believed 250 m) and GSA (believed ~250 m, long-term averages) were not verified this session.
- **SARAH-3:** the CM SAF data policy was not retrieved.

## 2. Demand/load and generation mix: ENTSO-E, OPSD, Ember, Eurostat, national TSOs (Energinet, Elexon); coverage back to the 1990s; licences

### Takeaway
Uniform hourly European load and generation data effectively starts in 2015 (ENTSO-E Transparency Platform, Regulation 543/2013). For 1990–2014, a game must combine annual or monthly statistics (Eurostat and Ember, both CC BY 4.0) with weather-driven synthetic hourly profiles.

ENTSO-E's licensing is only partly open. Since 2017–2020 it has a "free re-use" list, but PyPSA-Eur itself still records ENTSO-E and OPSD demand data as licence "unknown". Treat them as calibration inputs, not bundled assets.

Three national sources are clean and allow commercial use explicitly:
- Energinet (CC BY 4.0);
- Elexon BMRS (its own open licence);
- NESO (NESO Open Data Licence v1.0).

### Cited Findings
- **ENTSO-E free re-use list.** The Transparency Platform was set up under Regulation (EU) No 543/2013. Its Terms and Conditions include "the list of data provided by TSOs and Transmission Capacity Allocators… that can be re-used by platform users without any restriction", updated in October 2020. Data on that list can be freely re-used "with no need to seek the permission of the primary owner". — [ENTSO-E annual report 2020](https://annualreport2020.entsoe.eu/transparency-regulation); [ENTSO-E TP knowledge base](https://transparency.entsoe.eu/content/static_content/Static%20content/knowledge%20base/knowledge%20base.html) (search extracts)
- **ENTSO-E data policy.** The Board adopted its Data Policy on 23 November 2017, aiming "to increase data quality and data re-use with the ultimate objective of ensuring, when relevant, open data license". In February 2019 ENTSO-E said users "no longer have to seek permission" from TSO data owners, because TSOs release their data under an open data licence. The platform covers six categories: Load, Generation, Transmission, Balancing, Outages and Congestion Management. — [ENTSO-E annual report 2018](https://annualreport2018.entsoe.eu/transparency-and-trust/); [ENTSO-E news, 1 Feb 2019](https://www.entsoe.eu/news/2019/02/01/tsos-increase-number-of-open-data-available-through-entso-e-s-transparency-platform/) (search extracts)
- **PyPSA-Eur's licence classification of demand and statistics inputs** (all from its [data inventory [fetched]](https://raw.githubusercontent.com/PyPSA/pypsa-eur/master/doc/data_inventory.csv)):

  | PyPSA-Eur dataset | Description | Licence given |
  |---|---|---|
  | entsoe_electricity_demand | European country-level consumption via the ENTSO-E platform | "unknown" |
  | opsd_electricity_demand | European country-level consumption time series | "unknown" |
  | synthetic_electricity_demand | Country-level consumption time series from weather/temperature (Zenodo) | CC-BY-4.0 |
  | neso_electricity_demand | Great Britain consumption time series | NESO Open Data License v1.0 |
  | eurostat_balances | European energy balances by country and fuel | CC-BY-4.0 |
  | jrc_idees | Energy-economy-emissions data, 2000–2021 | CC-BY-4.0 |
  | powerplants (powerplantmatching) | Plant-level location, capacity, technology | CC-BY-4.0 |
  | tyndp | ENTSO-E/ENTSOG grid incl. planned lines | CC-BY-4.0 |
  | desnz_electricity_consumption | UK subnational consumption, 2005–2023 | Open Government Licence v3.0 |
  | swiss_energy_balances | Switzerland energy balances | "custom (admin.ch)" |
  | Swiss BFS data | Swiss statistics | "custom (OPEN BY ASK)" |

- **OPSD** time-series repository: its scripts "compile time series data of the European power system", and "This notebook as well as all other documents in this repository is published under the MIT License". That covers the code and documents, not the third-party data they compile. — [OPSD time_series README [fetched]](https://raw.githubusercontent.com/Open-Power-System-Data/time_series/master/README.md)
- **Ember:** "all of Ember's electricity data is fully open and available for free under a CC BY 4.0 license". It provides monthly demand, generation, capacity and CO2 data for 88 countries, updated twice a month. — [Ember Electricity Data Explorer](https://ember-energy.org/data/electricity-data-explorer/); [Ember methodology](https://files.ember-energy.org/public-downloads/ember_electricity_data_methodology.pdf) (search extracts)
- **Energinet / Energi Data Service (Denmark):** "Data on Energi Data Service is licensed under CC BY 4.0".
  - The licence grants "a worldwide, free, non-exclusive and otherwise unrestricted licence" to "copy, distribute and publish; adapt and combine with other material; and exploit commercially and non-commercially".
  - Suggested credit: "Source: Energinet (www.energidataservice.dk)".
  - Data "may not be used in a way which suggests that the Licensor endorses" the user. — [EDS licence PDF](https://www.energidataservice.dk/Conditions_for_use_of_Danish_public_sector_data-License_for_use_of_data_in_ED.pdf); [EDS support and service](https://energidataservice.dk/support-service) (search extracts)
- **Elexon (Great Britain):** "Elexon Limited grants a worldwide, royalty-free, perpetual, non-exclusive licence to use the BMRS Data". Users may "exploit the BMRS Data, including commercially, or by including it in their own product or application".
  - Mandatory attribution: "Contains BMRS data © Elexon Limited copyright and database right [year]", with a link to the licence where possible and the same statement in any sub-licence.
  - Users must not imply official status or endorsement, and must not misrepresent the data.
  - The Insights Solution API gives free access without an API key. — [Elexon: Licence to use BMRS open data](https://www.elexon.co.uk/data/balancing-mechanism-reporting-agent/copyright-licence-bmrs-data/); [BSC Open Data Licence](https://www.elexon.co.uk/bsc/data/open-data-requests/bsc-open-data-licence/) (search extracts)

### Inferences
- **Demand before 2015:** take annual national consumption (Eurostat or Ember, CC BY 4.0) and multiply by an hourly shape driven by ERA5 temperature (heating and cooling degree-hours), calendar effects (weekday, holidays, daylight) and a slow structural trend (electrification, efficiency). Fit that model on 2015+ ENTSO-E or national data. PyPSA-Eur's CC BY "synthetic_electricity_demand" input shows that weather-driven synthetic load is standard practice in open models.
- **ENTSO-E data:** use it to fit coefficients and validate distributions, and do not ship the raw series. Then the game distributes parameters it derived itself, not ENTSO-E's database. This lowers exposure if specific items turn out not to be on the free re-use list. EU sui generis database rights could matter if substantial raw extracts were shipped (not legal advice).
- **Bundle-safe national flavour data:** Danish (Energinet) and British (Elexon/NESO) series can be bundled with attribution. Denmark is the archetypal 1990s wind country, so a Danish scenario could show real reference curves.
- **Fleet history:** combine Ember (CC BY 4.0) capacity by fuel with powerplantmatching (CC BY 4.0) plant lists to script the "AI" historical fleet. Plant-level vintage data gives each plant's commissioning year.

### Gaps
- **ENTSO-E's own terms:** neither the "List of Data available for free re-use" nor the T&C licence name (CC BY 4.0 or custom) could be read. So it is unknown which items are covered (6.1.A actual load, 16.1 actual generation per type, 12.1.D day-ahead prices). Any changes on ENTSO-E's newer transparency platform during 2024–2025 were not checked.
- **OPSD coverage:** believed to be about 2015–2020 at 15/30/60-minute resolution for about 35 countries, last released 2020 [unverified]. The licence notes in its data-package metadata were not read.
- **Pre-2015 hourly load:** the old ENTSO-E "Data Portal" and the UCTE/Nordel statistical yearbooks were not investigated, and neither were their reuse terms.
- **Eurostat's copyright notice** was not read directly; only PyPSA-Eur's CC-BY-4.0 tag was seen.
- **Norway and Switzerland** (Statnett, Swissgrid) open-data terms were not investigated.

## 3. Prices: day-ahead history by market, free vs proprietary; ENTSO-E prices; Energinet; fuel and carbon prices

### Takeaway
Most historical day-ahead price series are proprietary: Nord Pool history now sits behind a paywall, and EPEX/EEX data is sold. The open routes are:
- **TSOs that republish prices under open licences.** Energinet (CC BY 4.0) covers DK1, DK2, DE, SE3, SE4, NO2 and the Nordic system price. Elexon (BMRS licence) covers Great Britain.
- **ENTSO-E,** from 2015, although its licence status for prices is unclear.

Pre-2000 price data is fragmentary. Fuel prices are clean: the World Bank Pink Sheet is CC BY 4.0 and monthly since 1960. No openly licensed daily EU ETS carbon price series was found.

This strongly favours computing prices from fundamentals in-game and using real price history only for calibration.

### Cited Findings
- **Nord Pool:** access to historical price data "became a payable service from June 7, costing €600 per year for up to three users". Nord Pool said that "it was no longer appropriate to provide free access to that data for everyone on an equal basis". Its site still shows hourly day-ahead prices back to the start of 2021, and it pointed users to the ENTSO-E Transparency Platform and TSO websites for hourly price history. — [ERR News](https://news.err.ee/1608701422/nord-pool-puts-historical-price-data-access-fees-down-to-rising-costs) (search extract; the article's year was not captured). The relevant contract is the [Nord Pool general terms for data services (PDF)](https://www.nordpoolgroup.com/498e4c/globalassets/download-center/power-data-services/general-terms-data-services-data.pdf) (not read).
- **Exchange chronology:**
  - Nord Pool ASA was formed in 1996 after Swedish deregulation, owned equally by the Swedish and Norwegian TSOs. Finland and Denmark joined in 1998–2000. — [Wikipedia: Nord Pool](https://en.wikipedia.org/wiki/Nord_Pool) (search extract)
  - APX started trading in May 1999, "the first electricity exchange market in Continental Europe". — [Wikipedia: APX Group](https://en.wikipedia.org/wiki/APX_Group) (search extract)
  - The first trade on the Leipzig Power Exchange (LPX, today's EEX) was on 15 June 2000. EEX Frankfurt and LPX competed until they merged in Leipzig in 2002. — [EEX milestones](https://www.eex-group.com/en/about/milestones) (search extract)
  - Powernext held its first day-ahead auction on 26 November 2001. — [EPEX SPOT: 20 years since first day-ahead auction](https://epexspot.com/en/news/epex-spot-celebrates-20-years-first-day-ahead-auction) (search extract)
- **OMIE (Iberia):** day-ahead, intraday and settlement files can be downloaded as CSV from its file-access list. They include prices, volumes, import/export capacity and the hourly generation mix. The data is "publicly available and published by OMIE subject to source citation and attribution". — [OMIE file access list](https://www.omie.es/en/file-access-list); [OMIEData on PyPI](https://pypi.org/project/OMIEData) (search extract)
- **Energinet "Elspotprices":** day-ahead spot prices for DK1, DK2, DE, SE3, SE4, NO2 and SYSTEM. The dataset was discontinued after 2025-09-30 and replaced by "Day-Ahead Prices". From 1 February 2025, DKK prices are computed from the EUR price using Danmarks Nationalbank exchange rates. Licence: CC BY 4.0, as in section 2. — [EDS Elspotprices metadata](https://api.energidataservice.dk/meta/dataset/Elspotprices) (search extract)
- **England & Wales Pool:** UK Data Service study SN 5247, "Electricity Wholesale Market Data, 1996–2004", was collected by Ofgem and National Grid Transco. It concentrates on April 1999–March 2001, "the last two years of the Electricity Pool before it was abolished in favour of" NETA. — [UK Data Service SN 5247](https://doc.ukdataservice.ac.uk/doc/5247/mrdoc/UKDA/UKDA_Study_5247_Information.htm) (search extract). Background: [Ofgem review of trading arrangements, England and Wales](https://www.ofgem.gov.uk/ofgem-publications/79088/review-electricity-trading-arrangements-background-england-and-walespdf) (not read)
- **ENTSO-E prices:** day-ahead prices are data item 12.1.D under the transparency regulation. API access requires a security token. — [openHAB ENTSO-E binding docs](https://www.openhab.org/addons/bindings/entsoe/) (search extract)
- **World Bank Pink Sheet:** 71 commodities, monthly from January 1960, licensed CC BY 4.0. Energy series cover crude oil, coal and natural gas, in nominal USD. — [World Bank CMO historical data (monthly)](https://thedocs.worldbank.org/en/doc/386771467756369668-0050022016/render/CMOHistoricalDataMonthly.pdf); [worldbank-commodities on PyPI](https://pypi.org/project/worldbank-commodities/) (search extracts). Corroborated by PyPSA-Eur's entry "worldbank_commodity_prices — Monthly commodity price data for fossil fuels and others — CC-BY-4.0" — [PyPSA-Eur data inventory [fetched]](https://raw.githubusercontent.com/PyPSA/pypsa-eur/master/doc/data_inventory.csv)
- **EU ETS data:**
  - The EEA's EU ETS data (2005–2025) covers emissions and allowances by country, sector and year, not prices. — [EEA EU ETS data](https://www.eea.europa.eu/data-and-maps/data/european-union-emissions-trading-scheme) (search extract)
  - EEX's daily EUA index, ECarbix, is a paid end-of-day subscription. — [EEX webshop: ECarbix](https://webshop.eex-group.com/data-type/eex-ecarbix-sftp) (search extract)
  - PyPSA-Eur's own carbon-price input ("instrat_co2_prices — EU ETS emission allowance prices — energy.instrat.pl") is listed with licence "unknown". — [PyPSA-Eur data inventory [fetched]](https://raw.githubusercontent.com/PyPSA/pypsa-eur/master/doc/data_inventory.csv)

### Inferences
- **Prices have to be computed.** Real price histories are mostly proprietary or of unclear licence, and the game needs prices that respond to the player's own building. So each hour's price should come out of a merit order built from:
  - fuel prices (Pink Sheet, CC BY 4.0, monthly);
  - a modelled carbon price;
  - plant efficiencies and emission factors (DEA data, section 4);
  - simulated weather and demand.

  Historical prices then serve only as calibration targets: annual mean, peak/off-peak spread, price-duration curve, number of negative-price hours, capture rates. The developer computes those statistics; the raw series are not redistributed.
- **Carbon price:** set it to zero before 2005. For 2005 to today, follow a path calibrated to widely reported annual averages. After that, let policy events and endogenous demand drive it. Single facts such as annual averages are generally not copyright-protected, whereas exchange daily series are licensed products (not legal advice).
- **Fuel prices after today:** run a stochastic mean-reverting process with occasional scripted or random shocks (oil-crisis-style events, a 2022-style gas crisis) so the future is not predictable.
- **Validation set:** Energinet's CC BY series for DK1/DK2/DE/SE3/SE4/NO2/system is a clean "ground truth" for checking the game's emergent prices. It could also appear in-game as an attributed "real history" reference chart.

### Gaps
- **Energinet start date:** the earliest date in Elspotprices was not retrieved (API blocked).
- **ENTSO-E prices:** it is unverified whether 12.1.D day-ahead prices are on the free re-use list. Those prices originate from power exchanges (NEMOs), not TSOs, so treat their status as unclear.
- **Exchange terms and dates not checked:**
  - OMIE's exact terms (especially commercial redistribution) were not read.
  - EPEX/EEX and GME (Italy) historic-data terms were not investigated.
  - The briefed start dates for OMEL (1998), IPEX/GME (2004), the UK Pool (1990), NETA (2001) and BETTA (2005) were not re-verified this session.
- **UK Pool data:** the UK Data Service end-user licence for SN 5247 (which may restrict commercial use) was not read. No source was found for full half-hourly Pool prices for 1990–1999.
- **Daily EUA prices:** no free, openly licensed daily series was identified. Ember's carbon-price viewer and ICAP's allowance price explorer were not checked.
- **Pink Sheet wording:** the World Bank's own licence wording was not quoted first-hand, though two consistent secondary sources say CC BY 4.0.

## 4. Technology cost/performance, learning curves and installed-capacity history

### Takeaway
Four main cost sources:
- **DEA Technology Data:** CC BY 4.0.
- **NREL ATB:** CC BY 4.0.
- **IRENA** publications and statistics: free reuse with an "© IRENA [year]" notice, but third-party material is excluded and may carry commercial-use restrictions.
- **Lazard:** proprietary. Use it only as a sanity check.

The learning curves are well documented:
- PV modules: about $106/W (1976) → $0.38/W (2019), roughly 20% cheaper per doubling of capacity.
- Lithium-ion battery packs: about $1,474/kWh (2010, in real 2025 dollars) → $108/kWh (2025).

### Cited Findings
- **DEA:** the Danish Energy Agency and Energinet publish technology catalogues, including one for generation of electricity and district heating. That catalogue was first published in August 2016 and is updated continuously via an amendment sheet. It "is licensed under Attribution 4.0 International". — [ENS technology catalogue PDF](https://ens.dk/media/3289/download); [ENS catalogue presentation](https://ens.dk/sites/ens.dk/files/widgets/multi_campaign/files/presentation_session_1_-_dk_technology_catalogue.pdf) (search extract)
- **PyPSA technology-data** "compiles assumptions on energy system technologies (such as costs, efficiencies, lifetimes, etc.) for chosen years (e.g. [2020, 2030, 2050])". Its code "is released as free software under the GPLv3", and "different licenses and terms of use may apply to the various input data". — [technology-data README [fetched]](https://raw.githubusercontent.com/PyPSA/technology-data/master/README.md). PyPSA-Eur lists the resulting "costs" dataset as CC-BY-4.0. — [PyPSA-Eur data inventory [fetched]](https://raw.githubusercontent.com/PyPSA/pypsa-eur/master/doc/data_inventory.csv)
- **IRENA terms:** "Material in IRENA publications may be freely used, shared, copied, reproduced, printed and/or stored, provided that all such material is clearly attributed to IRENA and bears a notation that it is subject to copyright (© IRENA), with the year of the copyright". However, "Material contained in IRENA publications attributed to third parties may be subject to third party copyright and separate terms of use and restrictions, including restrictions in relation to any commercial use". — [IRENA Renewable Capacity Statistics 2019](https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2019/Mar/IRENA_RE_Capacity_Statistics_2019.pdf) (search extract; the same text appears in the 2015–2019 editions)
- **IRENA, *Renewable Power Generation Costs in 2024*:**

  | Technology | Total installed cost, 2024 | Global weighted-average LCOE, 2024 |
  |---|---|---|
  | Solar PV | USD 691/kW | USD 0.043/kWh |
  | Onshore wind | USD 1,041/kW | USD 0.034/kWh |
  | Offshore wind | USD 2,852/kW | — |
  | Hydropower | — | USD 0.057/kWh |

  Utility-scale PV LCOE is down 90% since 2010. 91% of newly commissioned utility-scale renewable capacity was cheaper than the cheapest new fossil alternative. — [IRENA RPGC 2024](https://www.irena.org/publications/2025/Jun/Renewable-Power-Generation-Costs-in-2024); [IRENA RPGC 2024 summary PDF](https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2025/Jul/IRENA_TEC_RPGC_in_2024_Summary_2025.pdf) (search extracts)
- **NREL ATB:** annual current and projected CAPEX/OPEX by technology and vintage, plus operating characteristics. Data licence CC-BY-4.0. Published as an Excel workbook since 2015; data has been cloud-optimised in the OEDI data lake since 2021. — [NREL Data Catalog: ATB 2020](https://data.nrel.gov/submissions/145); [data.gov: ATB 2020](https://catalog.data.gov/dataset/2020-annual-technology-baseline-atb-cost-and-performance-data-for-electricity-generation-t-e0474) (search extracts)
- **Lazard LCOE+ 2025:** 18th edition, released 16 June 2025. Utility solar and onshore wind are the cheapest unsubsidised new-build; gas-fired LCOE is at a 10-year high. Its reproduction terms were not found. — [Lazard press release](https://www.lazard.com/news-announcements/lazard-releases-2025-levelized-cost-of-energyplus-report-pr/) (search extract)
- **PV module prices:** Our World in Data's series runs 1975–2024 in constant 2024 US$/W.
  - It is compiled from Nemet (2009) for 1975–2003, Farmer & Lafond (2016) for 2004–2009, and IRENA from 2010.
  - Modules fell from $106/W to $0.38/W between 1976 and 2019.
  - "for every doubling of installed solar capacity, the price of solar modules declined by roughly 20%".
  - Prices exclude installation and balance of system, and are deflated with the US GDP deflator. — [OWID: Solar PV prices](https://ourworldindata.org/grapher/solar-pv-prices) (search extract)
- **Battery packs (BNEF 2025 survey):** the global average was $108/kWh in 2025, down 8% year on year. That is about 93% below roughly $1,474/kWh in 2010 (real 2025 dollars). Stationary-storage packs were $70/kWh (down 45%), battery-electric-vehicle packs $99/kWh, and China's average $84/kWh. — [BNEF: new record lows for battery prices](https://about.bnef.com/insights/clean-transport/new-record-lows-for-battery-prices/); [pv magazine USA, 9 Dec 2025](https://pv-magazine-usa.com/2025/12/09/global-lithium-ion-battery-pack-prices-fall-to-108-kwh-says-bnef/) (search extracts)
- **Installed-capacity history sources:**
  - IRENA Renewable Capacity Statistics (annual, IRENA terms above). — [IRENA RE Capacity Statistics 2016](https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2016/IRENA_RE_Capacity_Statistics_2016.pdf) (search extract)
  - OWID installed-PV charts. — [OWID installed solar PV capacity](https://ourworldindata.org/grapher/installed-solar-pv-capacity?tab=map) (search extract)
  - Ember capacity data (CC BY 4.0, section 2).
  - powerplantmatching plant list (CC-BY-4.0). — [PyPSA-Eur data inventory [fetched]](https://raw.githubusercontent.com/PyPSA/pypsa-eur/master/doc/data_inventory.csv)

### Inferences
- **Learning-curve mechanic:** cost(t) = C₀ × (Q_cum(t)/Q₀)^(−b), with b = −log₂(1 − learning rate). A 20% learning rate gives b ≈ 0.32. Using *global* cumulative capacity (a scripted historical path plus the player's additions) reproduces history and lets heavy player investment pull costs down faster, which is a natural tycoon mechanic.
- **Plant parameters:** DEA is the best single source that can be bundled. It covers efficiency, O&M, lifetime, ramp rates, minimum load and projections to 2050, under CC BY 4.0. NREL ATB (CC BY 4.0) is a second source. Use IRENA for historical cost trajectories with "© IRENA [year]", and avoid IRENA material credited to third parties.
- **Proprietary figures:** treat BNEF and Lazard numbers as reported facts for calibration. Do not reproduce their tables or charts.
- **PV before 1990:** OWID's 1975 starting point gives a ready-made pre-history curve, so 1990 module prices can be set by the curve.

### Gaps
- **Wind turbine history:** size, rating and cost history (roughly a few hundred kW in the early 1990s up to 10–15 MW offshore today [unverified]) was not verified this session. Candidate sources: IRENA RPGC time series, the LBNL Wind Technologies Market Report, and Danish industry statistics.
- **OWID licence:** believed to be CC BY 4.0 for OWID-produced data, with third-party data keeping its original terms [unverified]. The licence terms of Nemet's 2009 underlying data are unknown.
- **DEA licence check:** the DEA licence comes from a search extract of ens.dk PDFs. Confirm it on the catalogue edition actually used.
- **Lazard terms** were not found; assume all rights reserved.
- **Newer editions:** a 2026 IRENA edition (costs in 2025) and a 2026 Lazard edition may exist; not checked. IRENASTAT database terms, as distinct from publication terms, were not checked.

## 5. Modelling approaches suited to a game (merit order, scarcity and negative prices, cannibalisation, coupling, hydro, storage, weather resampling vs stochastic generators, time resolution, open models)

### Takeaway
Run an hourly, per-zone merit-order auction with:
- interconnector coupling limited by net transfer capacity (NTC: the maximum power a cross-border link can carry);
- a scarcity price adder;
- negative bids from must-run plant and subsidised output;
- water values for hydro reservoirs.

That combination reproduces the phenomena that matter (solar cannibalisation, negative prices, Dunkelflaute price spikes, wet/dry-year Nordic prices) at negligible compute cost.

For weather, resampled real weather-years work best: block bootstrap over 1950–2024 PECD/ERA5 years with light perturbation. This keeps cross-country correlation far better than simple synthetic generators.

Open models can be studied, simplified or used offline for calibration: PyPSA (MIT), oemof.solph (MIT), Balmorel (ISC, needs GAMS), atlite (MIT). The game itself should carry its own lightweight dispatch rather than embed an optimisation (linear-programming) stack.

### Cited Findings
- **PyPSA:** "PyPSA is licensed under the open source MIT License… The documentation is licensed under CC-BY-4.0". It covers unit commitment and economic dispatch, linear optimal power flow, capacity expansion, inter-temporal storage including hydro, and sector coupling, and is built for large networks and long time series. — [PyPSA README [fetched]](https://raw.githubusercontent.com/PyPSA/PyPSA/master/README.md)
- **PyPSA-Eur:** "The code in PyPSA-Eur is released as free software under the MIT License", but "Different licenses and terms of use may apply to the various input data". It is "an open model dataset of the European energy system at the transmission network level that covers the full ENTSO-E area", "usually clustered down to 50-250 nodes". — [PyPSA-Eur README [fetched]](https://raw.githubusercontent.com/PyPSA/pypsa-eur/master/README.md)
- **PyPSA-Eur inputs that would block commercial redistribution:**
  - "lau_regions — Permission for non-commercial use only";
  - "wdpa — Custom, redistribution not permitted";
  - "aquifer_data — Use without restriction, no redistribution";
  - "corine — Custom similar to CC-BY";
  - "unknown" for ENTSO-E/OPSD demand and instrat CO2 prices.

  So PyPSA-Eur's assembled dataset cannot be shipped wholesale. — [PyPSA-Eur data inventory [fetched]](https://raw.githubusercontent.com/PyPSA/pypsa-eur/master/doc/data_inventory.csv)
- **oemof.solph:** "SPDX-License-Identifier: MIT". A model generator for energy-system modelling and optimisation using linear and mixed-integer programming (LP/MILP). — [oemof-solph README [fetched]](https://raw.githubusercontent.com/oemof/oemof-solph/dev/README.rst)
- **Balmorel:** "The ISC license" was assigned in 2017. It is "a partial equilibrium model for analysing the electricity and combined heat and power sectors in an international perspective", mainly a linear programme, and it requires GAMS (a demo runs on an academic trial licence). — [Balmorel README [fetched]](https://raw.githubusercontent.com/balmorelcommunity/Balmorel/master/README.md)
- **atlite** (MIT) converts weather data into capacity factors, heat demand and hydro inflow. — [atlite README [fetched]](https://raw.githubusercontent.com/PyPSA/atlite/master/README.rst)
- **Climate years in practice:** PECD and C3S provide multi-decade hourly capacity factors for historical and future (projection) periods, made with ENTSO-E. — [CDS sis-energy-pecd](https://cds.climate.copernicus.eu/datasets/sis-energy-pecd); [CDS sis-energy-derived-projections](https://cds.climate.copernicus.eu/datasets/sis-energy-derived-projections) (search extracts). TSO adequacy studies run sets of "climate years", e.g. [Elia 2022 public-consultation appendix "climate years"](https://www.elia.be/-/media/project/elia/elia-site/public-consultations/2022/20221028_appendix_climate_years.pdf) (only the title was seen).
- **Wind calibration:** reanalysis wind speeds need bias correction to match observed fleet output (VWF implements this). — [VWF README [fetched]](https://raw.githubusercontent.com/renewables-ninja/vwf/master/README.md)

### Inferences (design reasoning, mostly not from sources)
**Price formation (zonal merit order)**
- **Bids.** Each zone and hour has a supply stack of plant blocks, each bidding:

  > marginal cost = fuel price ÷ efficiency + carbon price × emission factor ÷ efficiency + variable O&M

  - Wind and solar bid about 0, or *minus* their per-MWh subsidy when that subsidy is only paid while producing. This is the mechanism behind negative prices.
  - Inflexible plant (nuclear, combined heat and power, units at minimum load) bids below zero, down to its cost of cycling.
  - The price is the bid of the marginal block at the residual (net) demand.
  - Compute load [calc]: 40 zones × ~15 blocks × 8,760 h ≈ 5.3 million block evaluations per simulated year, which is trivial.
- **Scarcity.** When available capacity falls below demand plus a reserve margin, add a scarcity adder that rises toward a price cap. A value-of-lost-load curve or an "operating reserve demand curve" style function both work. This produces realistic spikes in cold, still, dark weeks and rewards flexible plant and storage.
- **Cannibalisation emerges by itself.** As the player builds solar, midday net demand falls and cheaper plants set the price, until solar itself sets it, so solar's capture price drops. No special rule is needed; this is the effect Hirth (2013) quantified (see Gaps).
- **Interconnectors and market coupling.**
  - Exact option: one small LP per hour (or per day when storage is present), as a transport/NTC model.
  - Cheap heuristic: iterative flow from low-price to high-price neighbours until prices equalise or a line congests. A congested line causes price separation, for example DK1 vs DE or NO2 vs NL.
- **Hydro reservoirs.** Bid at a *water value*: an opportunity cost that rises as the reservoir empties and falls when it is full or the spring melt is coming. Inflows come from PECD/ERA5 runoff. Nordic prices then track wet and dry years, a defining real feature.
- **Storage.** Simple rule: charge below a rolling 24-hour price quantile and discharge above one. Better: a daily look-ahead optimisation on the forecast price curve. Storage bids into the same stack, so a fleet of batteries flattens the price curve and erodes its own arbitrage margin, which is good tycoon dynamics.
- **AI investors.** Scripted historical builds up to "today", then price-responsive AI entry and exit. This keeps the world reacting to the player, for example by building gas peakers if prices spike.

**Weather: real-year resampling vs synthetic generators**
- **Resampling real weather-years, or season/week blocks within years.**
  - It keeps the true joint statistics: cross-country correlation (pan-European lulls), the covariance of wind, solar, temperature and hydro, and the daily and seasonal shapes.
  - Downsides: variety is finite (75 PECD years) and players might learn to recognise years.
  - Unpredictability can be restored by:
    - drawing years at random and decoupled from calendar years;
    - block-bootstrapping weeks within the same season;
    - small multiplicative noise;
    - a climate-trend shift for future years, for example via PECD/C3S projection years.
- **Synthetic stochastic generators** (Markov chains over weather regimes, multivariate AR/VAR on de-seasonalised series, analog methods).
  - Upsides: unlimited variety and a tiny data footprint.
  - Downsides: hard to calibrate jointly across 40 zones × 5 variables; tendency to underrepresent extremes and multi-day persistence unless explicitly fitted; risk of physically inconsistent combinations.
- **Hybrid.** A weather-regime Markov chain that picks *real* analog days or weeks from the archive gives novelty without losing physical realism or spatial correlation.
- **Time resolution.** Hourly is cheap for dispatch and needed for solar cannibalisation, daily storage cycles and negative-price hours.
  - Representative days (say 12 per year) would cut the data about 30-fold (about 2.6 M vs 79 M values over 45 years [calc]).
  - But they erase multi-day Dunkelflaute persistence and inter-day storage value, which is where the drama is.
  - Recommendation: simulate hourly internally and let the UI advance by day or week.

**Reusing open models**
- PyPSA and PyPSA-Eur are Python plus external LP solvers, built for runs lasting minutes to hours. They are a good offline calibration tool, for example to compare the game's heuristic dispatch against a full optimisation for a few weather-years, but they do not belong in the shipped game loop.
- MIT and ISC code can be reused commercially if its copyright and licence notice is kept. GPLv3 code (the technology-data scripts) would impose copyleft if linked into the game, so keep it offline. Balmorel's GAMS dependency rules it out for shipping.

### Gaps
- **Hirth (2013) not re-verified.** "The market value of variable renewables: The effect of solar wind power variability on their relative price", *Energy Economics* 38, 218–236, doi:10.1016/j.eneco.2013.02.004, could not be fetched (RePEc/ScienceDirect blocked, search budget exhausted). From memory [unverified], the abstract says: wind's market value falls from about 110% of the average power price to about 50–80% as wind's share rises from zero to 30% of consumption, and solar reaches similar values at about 15% penetration. Verify before quoting.
- **EMMA** (Hirth/Neon's European Electricity Market Model) licence and implementation are unverified. It is believed to be GAMS-based and released CC BY-SA 4.0 [unverified].
- **Literature not retrieved:** Dunkelflaute frequency and cross-country correlation, weather-regime studies, and stochastic weather-generator methods for wind and solar. Wikipedia and journal domains were blocked and the search budget was exhausted.
- **Negative prices:** statistics such as hours per year in DE/NL/ES in 2023–2025 were not retrieved.
- **Market rules:** the harmonised day-ahead price limits in the EU single day-ahead coupling (SDAC) were not verified; nor was the move to 15-minute day-ahead products in late 2025. That move is only indirectly suggested by Energinet switching datasets on 2025-09-30.
- **HiGHS** (believed MIT-licensed, a possible embedded LP solver) was not verified. PyPSA-Eur's default weather year was not verified.

## 6. Pre-liberalisation (1990s): how independent/renewable producers were paid before spot markets, and how to model that era

### Takeaway
What is verified is the timeline of organised markets:
- England & Wales Pool, ending with NETA in March 2001;
- Nord Pool from 1996;
- APX from May 1999;
- LPX from June 2000;
- Powernext from November 2001.

Before each country's market start, prices were set administratively. Primary sources on the specific 1990s renewable tariff regimes could not be retrieved this session. The leads listed under Gaps (Germany's 1991 Stromeinspeisungsgesetz, Danish wind tariffs, the UK NFFO) are background knowledge that must be verified before use. For the game, a "regulated tariff mode" per country that switches to "spot market mode" on that country's liberalisation date is the natural design.

### Cited Findings
- The England & Wales Electricity Pool ran until it "was abolished in favour of" the New Electricity Trading Arrangements (NETA); April 1999–March 2001 were its last two years. — [UK Data Service SN 5247](https://doc.ukdataservice.ac.uk/doc/5247/mrdoc/UKDA/UKDA_Study_5247_Information.htm) (search extract)
- Nord Pool ASA formed in 1996 with Swedish deregulation; Finland and Denmark joined between 1998 and 2000. — [Wikipedia: Nord Pool](https://en.wikipedia.org/wiki/Nord_Pool) (search extract)
- APX (Netherlands) started trading in May 1999 as continental Europe's first power exchange. — [Wikipedia: APX Group](https://en.wikipedia.org/wiki/APX_Group) (search extract)
- The Leipzig Power Exchange's first trade was on 15 June 2000. — [EEX milestones](https://www.eex-group.com/en/about/milestones) (search extract)
- Powernext (France) held its first day-ahead auction on 26 November 2001. — [EPEX SPOT](https://epexspot.com/en/news/epex-spot-celebrates-20-years-first-day-ahead-auction) (search extract)

### Inferences
- **Regulated mode, per country, before its market opens:**
  - A single vertically integrated utility (or a national pool) dispatches plants internally by merit order. The game can reuse the same dispatch engine but shows no public spot price.
  - Independent and renewable producers are paid a *regulated tariff*. Options: a percentage of the average retail tariff (a German-style feed-in law), a percentage of utility costs plus tax refunds (Danish-style), or contract prices won in periodic auction rounds (UK NFFO-style). Each is paid regardless of the hour, so there is no cannibalisation.
  - This creates a teachable shift: 1990s projects earn flat tariffs, and after liberalisation the same assets face hourly prices, cannibalisation and negative prices. That progression is a strong historical arc for the campaign.
- **Liberalisation as a timed event.** Each country flips to market mode on a historical date. A scenario or "alternate history" option could move those dates.
- **Policy cards.** Model tariff design as a policy card (feed-in tariff → feed-in premium → auctions/CfDs) that changes the player's revenue stack. This mirrors the real European sequence without hard-coding exact national rules.

### Gaps
These are **unverified leads for the report-writer or a follow-up researcher**. None could be checked this session; all must be verified before use.
- **Germany: Stromeinspeisungsgesetz (StrEG)** of 7 December 1990, in force 1 January 1991 [unverified].
  - Grid operators had to accept renewable electricity and pay a set percentage of the average revenue per kWh from sales to final consumers: about 90% for wind and solar, and about 75–80% (or 65% for larger plants) for hydro, landfill/sewage gas and biomass.
  - A 1998 amendment added a 5% hardship cap.
  - It was replaced by the EEG, with fixed technology-specific tariffs, from 1 April 2000.
- **Denmark** [unverified].
  - From the early 1990s, utilities had to buy private wind power at about 85% of the utility's production-and-distribution cost (roughly the consumer price excluding taxes), plus tax refunds or production subsidies.
  - The market reform around 1999–2000 led into Nord Pool membership (DK1 1999, DK2 2000), and the fixed tariffs were phased into market price plus premium in the early 2000s.
- **United Kingdom** [unverified].
  - Privatisation under the Electricity Act 1989, with the Pool from 1990.
  - The Non-Fossil Fuel Obligation (NFFO) ran rounds 1–5 in England & Wales (1990–1998): contracts were awarded competitively and funded by the Fossil Fuel Levy, with wind contract prices falling sharply across rounds. Scotland (SRO) and Northern Ireland had analogues.
  - NFFO was replaced by the Renewables Obligation in 2002; NETA came in 2001 and BETTA in 2005.
- **EU-level dates** [unverified]: Directive 96/92/EC (first electricity directive; progressive opening from 1999), Directive 2003/54/EC, and full retail opening by July 2007.
- **Other national markets** [unverified]: Spain's OMEL day-ahead market from 1998, with a "special regime" for renewables; Italy's IPEX/GME from 2004; Norway's Energy Act 1990, with Statnett Marked from 1993.
- **Price data:** no open data source for 1990s regulated tariff levels (for example average retail prices by country from 1990) was identified. Eurostat or IEA price statistics would be the candidates, and their licences need checking (IEA data is generally proprietary [unverified]).

## 7. Practical recommendation: what to bundle, what to use only for calibration, required attribution, simplest credible design

### Takeaway
**Bundle (all CC BY 4.0 or equivalent, about 100–300 MB in total):**
- zone-aggregated hourly weather-derived series (onshore and offshore wind, solar, hydro inflow, temperature) for about 40 zones over 45–75 weather-years, built by the developer from ERA5/PECD;
- annual demand and capacity statistics (Eurostat, Ember);
- monthly fuel prices (World Bank Pink Sheet);
- technology parameters (DEA, NREL ATB; IRENA with © notice);
- optionally, Energinet and Elexon real series as reference charts.

**Use only for calibration or validation:**
- ENTSO-E load and prices;
- OPSD;
- Nord Pool, EPEX and OMIE prices;
- Renewables.ninja (CC BY-NC);
- Lazard and BNEF figures.

**Simplest credible simulation:** an hourly zonal merit order with NTC coupling, scarcity and negative-bid rules, hydro water values and rule-based storage; resampled real weather-years with perturbation; and a regulated-tariff mode before each country's liberalisation date.

### Cited Findings
Licence and attribution facts the recommendation rests on, all cited in sections 1–4:
- **ERA5 / CDS:** CC BY 4.0 since 2 July 2025, commercial use allowed with credit to C3S/ECMWF and a licence link. — [ECMWF forum](https://forum.ecmwf.int/t/cc-by-licence-to-replace-licence-to-use-copernicus-products-on-02-july-2025/13464) (search extract)
- **Renewables.ninja:** CC BY-NC 4.0; commercial use requires contacting the team. — [Renewables.ninja downloads](https://renewables.ninja/downloads) (search extract)
- **GSEE and VWF code:** BSD-3-Clause; VWF power curves are excluded. — [GSEE [fetched]](https://raw.githubusercontent.com/renewables-ninja/gsee/master/README.md); [VWF [fetched]](https://raw.githubusercontent.com/renewables-ninja/vwf/master/README.md)
- **GWA attribution:** "[Data/information/map obtained from the] Global Wind Atlas 3.0, a free, web-based application developed, owned and operated by the Technical University of Denmark (DTU). The Global Wind Atlas 3.0 is released in partnership with the World Bank Group, utilizing data provided by Vortex, using funding provided by the Energy Sector Management Assistance Program (ESMAP)". — [World Bank data catalog: GWA](https://datacatalog.worldbank.org/search/dataset/0038957/global-wind-atlas) (search extract)
- **GSA attribution:** "© 2020 The World Bank, Source: Global Solar Atlas 2.0, Solar resource data: Solargis", plus the unread "mandatory and binding addition". — [Solargis GSA downloads](https://solargis.com/maps-and-gis-data/download/world) (search extract)
- **PVGIS acknowledgement:** "PVGIS © European Communities, 2001-2026". — [PVGIS hourly radiation](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/pvgis-5-tools/hourly-radiation_en) (search extract)
- **Energinet credit:** "Source: Energinet (www.energidataservice.dk)"; commercial use explicitly allowed. — [EDS licence](https://www.energidataservice.dk/Conditions_for_use_of_Danish_public_sector_data-License_for_use_of_data_in_ED.pdf) (search extract)
- **Elexon:** "Contains BMRS data © Elexon Limited copyright and database right [year]"; commercial use, including in products, allowed. — [Elexon BMRS licence](https://www.elexon.co.uk/data/balancing-mechanism-reporting-agent/copyright-licence-bmrs-data/) (search extract)
- **IRENA:** "© IRENA" with the year; third-party material is excluded. — [IRENA RE Capacity Statistics 2019](https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2019/Mar/IRENA_RE_Capacity_Statistics_2019.pdf) (search extract)
- **Ember, World Bank Pink Sheet, NREL ATB, DEA:** all CC BY 4.0. — [Ember](https://ember-energy.org/data/electricity-data-explorer/); [World Bank CMO](https://thedocs.worldbank.org/en/doc/386771467756369668-0050022016/render/CMOHistoricalDataMonthly.pdf); [NREL ATB](https://data.nrel.gov/submissions/145); [ENS](https://ens.dk/media/3289/download) (search extracts)
- **Licence uncertainty in a leading open model:** PyPSA-Eur lists ENTSO-E demand, OPSD demand and instrat CO2 prices as "unknown" licences, and some of its inputs as non-commercial or no-redistribution. — [PyPSA-Eur data inventory [fetched]](https://raw.githubusercontent.com/PyPSA/pypsa-eur/master/doc/data_inventory.csv)

### Inferences
**A. Data bundle (shipped with the game)**

| Layer | Source (licence) | Processing | Approx. size [calc] |
|---|---|---|---|
| Hourly wind on/offshore, solar CF, hydro inflow, temperature, ~40 zones | ERA5 or PECD 4.2 (CC BY 4.0) via own GSEE/VWF/atlite-style code (BSD/MIT) | Aggregate to zones; era-specific turbine power curves; bias-correct against observed fleet output | 45 years: ~79 MB (uint8) / ~158 MB (float16); 75 years: ~131 / ~263 MB |
| Site-quality map layer | GWA 3 / GSA 2 (CC BY 4.0 + GSA addition) | Downsample to game map tiles | Tens of MB depending on map resolution (not computed) |
| Annual demand by country (1990–today) and fuel mix/capacity | Eurostat (CC BY 4.0 per PyPSA-Eur), Ember (CC BY 4.0) | Script historical AI fleet and demand path | < 1 MB |
| Plant-level historic fleet (optional) | powerplantmatching (CC BY 4.0) | Commissioning-year lists by zone | ~1–5 MB |
| Monthly coal/gas/oil prices since 1960 | World Bank Pink Sheet (CC BY 4.0) | Convert to €/MWh-thermal, add transport | < 1 MB |
| Technology parameters and projections | DEA (CC BY 4.0), NREL ATB (CC BY 4.0), IRENA (© IRENA) | Per-vintage CAPEX/OPEX/efficiency tables + learning-curve parameters | < 1 MB |
| Optional real reference series | Energinet (CC BY 4.0), Elexon BMRS (open licence) | DK and GB price/load charts for an in-game "history" panel | ~10–50 MB |

**B. Calibration and validation only (not shipped)**
- ENTSO-E Transparency Platform: hourly load, generation and day-ahead prices from 2015, because licence status is unclear for some items.
- OPSD packages.
- Nord Pool, EPEX and GME prices (proprietary).
- OMIE files (attribution-only terms, but commercial redistribution is unconfirmed).
- Renewables.ninja: compare the game's own capacity factors against ninja outputs (non-commercial use during development).
- Lazard, BNEF and IRENA third-party figures as sanity checks.
- PyPSA-Eur run offline as a "gold standard" against which the heuristic dispatch is benchmarked.

**C. Attribution / credits screen (draft, to be confirmed by legal review)**
- "Contains modified Copernicus Climate Change Service information [year(s)], CC BY 4.0." Adjust to the exact wording on the CDS licence page.
- The GWA attribution sentence, quoted in full.
- "© 2020 The World Bank, Source: Global Solar Atlas 2.0, Solar resource data: Solargis", plus the GSA addition.
- "PVGIS © European Communities, 2001–2026", only if PVGIS data is used.
- "Source: Energinet (www.energidataservice.dk), CC BY 4.0."
- "Contains BMRS data © Elexon Limited copyright and database right [year]."
- "Ember (ember-energy.org), CC BY 4.0"; "Eurostat"; "World Bank Commodity Price Data (The Pink Sheet), CC BY 4.0"; "Danish Energy Agency & Energinet, Technology Data, CC BY 4.0"; "NREL Annual Technology Baseline, CC BY 4.0"; "© IRENA [year]".
- For code reused from GSEE/VWF (BSD-3) or atlite/PyPSA/oemof (MIT): keep their copyright and licence notices in the shipped documentation. Do not use VWF's `power_curves` folder, which keeps its original copyright.

**D. Simplest credible simulation design**
1. **Space.** About 30–40 zones: one per country, split where gameplay needs it, e.g. DK1/DK2, NO, SE, IT. Connect them with an NTC-limited interconnector graph that grows over time (historic projects plus player-financed lines).
2. **Time.** Simulate hourly (8,760 steps per year) internally. The UI fast-forwards by day, week or month; at about 5 M block evaluations per year, a year simulates in well under a second [calc/inference].
3. **Weather.** Use precomputed zonal series for 1950–2024 weather-years.
   - In "historical" mode the real calendar year plays out.
   - In "dynamic" mode years are drawn at random, or season/week blocks are bootstrapped, from a seeded random generator, with ±5–10% multiplicative noise.
   - Future years use climate-projection-adjusted draws.
4. **Demand.** Annual energy follows a calibrated path. The hourly shape is a function of temperature, calendar, hour and an electrification trend, plus price elasticity or flexible demand later in the game.
5. **Supply.** A historical AI fleet is scripted from Ember/powerplantmatching up to "today". After that, AI investors enter and exit in response to prices. The player's builds add to the same stack.
6. **Price.** Merit order, plus a scarcity adder, plus negative bids from subsidised and must-run plant, plus NTC coupling, plus hydro water values, plus storage arbitrage.
7. **Fuels and carbon.** Fuels follow real monthly Pink Sheet history up to today, then a stochastic mean-reverting path with event shocks. Carbon is zero before 2005, then follows a calibrated path, then a policy-driven future.
8. **Era rules.** Each country starts in regulated-tariff mode and switches to market mode on its liberalisation date. Subsidy regimes act as policy cards: feed-in tariff → premium → auction/CfD.
9. **Calibration loop.** Compare simulated against real (ENTSO-E/Energinet/Elexon) annual mean prices, price-duration curves, solar and wind capture rates, and negative-price hours for 2015–2024. Tune the plant stacks, scarcity curve and hydro water values until the shapes match. Exact replication is not the goal.

### Gaps
**Must verify before release:**
- ENTSO-E free-re-use list items and T&C;
- the GSA "mandatory and binding addition";
- the exact CDS/PECD licence and attribution text;
- EMHIRES and PVGIS commercial clauses;
- OMIE terms;
- MERRA-2 policy, if MERRA-2 is used instead of ERA5.

**Not computed:** the size of a high-resolution site-quality raster layer. It depends on map design.

**Legal review:** a short review by an IP lawyer is advisable. Points to cover: EU database-right exposure from shipping derived ENTSO-E-calibrated parameters (believed low), and how CC BY attribution should appear in a game (credits screen vs documentation).
