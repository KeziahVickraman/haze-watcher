# Chat History & Project Log: SG AirWatch

This document records the full prompt and implementation history for the **SG AirWatch** Singapore live PSI & air quality monitoring application.

---

## Prompt 1: Initial Application Specification

### User Request
> build a singapore based application that tracks live PSI levels and alerts users when air quality drops to unhealthy thresholds. It should include an interactive map and push notifications.
>
> build just the front end for now, I will add the serverless backend connection later.

### Implementation Summary
- **Domain & Theme**: Built a Singapore-focused environmental telemetry console with dark clinical aesthetics conforming to strict frontend design rules (60-30-10 color budget, zero static pills, tabular figures with JetBrains Mono, Plus Jakarta Sans display typography).
- **Public API Integration**: Integrated Singapore government data feeds (`api.data.gov.sg/v1/environment/psi` and `pm25`) across 5 official regions: Central, North, South, East, and West, plus National aggregate.
- **Interactive Map**: Centered on Singapore with Leaflet and CartoDB dark tiles:
  - Regional badges with dynamic PSI/PM2.5 band color codes.
  - Secondary monitoring stations (Woodlands, Ang Mo Kio, Jurong Industrial, Marina South, Changi Airport, Clementi, Punggol).
  - Layer toggles for 24-hr PSI, 1-hr PM2.5, prevailing wind trajectory vectors, and regional hotspot clusters.
  - Interactive drilldown inspection card.
- **Push Notification & Alert Engine**:
  - Web Notification API integration (`Notification.requestPermission()`, `new Notification()`).
  - Configurable alert threshold sliders (PSI $\ge 100$ Unhealthy, PM2.5 $\ge 55\,\mu\text{g/m}^3$ Elevated).
  - Web Audio API dual-tone synthesized chime for audio alerts.
  - In-app floating toast banners with direct action links to health advisories.
  - Built-in simulation scenario switcher (*Live NEA*, *Clean Day*, *Moderate*, *Haze Alert*, *Crisis*) to test alerting without needing a live haze disaster.
  - Audit log recording all triggered thresholds.
  - Webhook dispatcher and contract preview for future serverless backend integration.
- **24-Hour Regional Trend Chart**: SVG time-series line chart with hover crosshair and threshold reference lines.
- **NEA 6-Parameter Matrix**: Breakdown of $\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{O}_3$, $\text{NO}_2$, $\text{SO}_2$, and $\text{CO}$.
- **MOH / NEA / MOE / MOM Health Advisories**: Guidance for schools, outdoor labor, sports, vulnerable demographics, N95 respirators, and HEPA air purifiers.
- **ASMC Regional Hotspot Radar**: Satellite fire counts across Sumatra and Kalimantan with transboundary haze risk levels.

---

## Prompt 2: GitHub Repository Setup & Push

### User Request
> git push https://[REDACTED_TOKEN]@https://github.com/KeziahVickraman/haze-watcher.git

### Implementation Summary
- Initialized local git repository (`git init`).
- Configured user credentials (`Keziah Vickraman` / `keziahvickraman@gmail.com`).
- Staged all source files and committed: `"Initial commit: SG AirWatch - Singapore live PSI & air quality alert monitor"`.
- Corrected the duplicate `https://` syntax in the provided URL and pushed branch `main` to `https://github.com/KeziahVickraman/haze-watcher.git`.
- Sanitized the local `.git/config` remote URL to ensure no personal access token was retained in plaintext.

---

## Prompt 3: Serverless API Integration (data.gov.sg v2)

### User Request
> add a serverless API connection that pulls live data from data.gov.sg using the following endpoint:
>
> `GET https://api-open.data.gov.sg/v2/real-time/api/psi`
>
> 1. store this in `/api` folder in the project root level, NOT the src folder
> 2. include `/health.ts` and `/psi.ts` within the same subfolder 
> 3. there is no key required for this service

### Implementation Summary
- Created `/api` directory in the project root level:
  - **`/api/health.ts`**: Universal serverless health endpoint returning status, uptime, service info, and route links.
  - **`/api/psi.ts`**: Serverless function that performs `GET https://api-open.data.gov.sg/v2/real-time/api/psi` without an API key, formats regional readings, and provides CORS (`Access-Control-Allow-Origin: *`) and caching headers (`Cache-Control: public, max-age=60, s-maxage=120`). Dual-exported for Node/Express serverless (`export default handler`) and Web Standard Fetch API (`export async function GET(request)`).
- Created **`server.ts`** mounting `/api/health` and `/api/psi` on Express, integrated with Vite dev server middleware on port 3000.
- Updated **`package.json`** scripts: `"dev": "tsx server.ts"` and `"start": "tsx server.ts"`.
- Updated **`src/services/airQualityService.ts`** to query `/api/psi` with graceful fallback to direct data.gov.sg v2.
- Verified endpoints via `curl http://localhost:3000/api/health` and `curl http://localhost:3000/api/psi`.
- Committed and pushed changes to `main` branch on GitHub: `"Add serverless API endpoints /api/health and /api/psi pulling live data from api-open.data.gov.sg"`.

---

## Prompt 4: Export Chat History

### User Request
> export this entire chat as an .md file --> PROMPTS.md

### Implementation Summary
- Created `PROMPTS.md` containing the complete chronological record of user requests, technical decisions, architecture, and verification steps.
