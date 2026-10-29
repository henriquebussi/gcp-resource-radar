# Gcp Resource Radar

Role: Senior Frontend Engineer & UI/UX Designer

Goal: Create a complete, production-ready React component structure for a GCP Infrastructure & FinOps Dashboard with mock data.

Design & UI/UX Guidelines:

- Theme: Minimalist with a Scientific & Professional aesthetic.

- Color Palette: Clean White background with Emerald/Forest Green accents (e.g., green indicators, subtle green gridlines/glows, high contrast dark-slate typography).

- UI Components: Tailwind CSS + shadcn/ui components (Cards, Tabs, Selects, Badges, Dialogs).

- Charts: ApexCharts (via `react-apexcharts`) for crisp, high-density time-series data visualization (line, area, and stacked bar charts).

Technical Requirements:

1. Filters Bar: Period selector (24h, 7d, 30d), Environment (Production, Staging, Development), Service, and Resource search.

2. Dashboard Tabs/Sections:

   - Database (QPS, Active Connections, Locks, Slow Queries, Avg Response Time, CPU/IO, Replication Lag)

   - Cloud (CPU/RAM/Disk consumption, Estimated Cost, Uptime)

   - Storage (Total Usage, Usage per Bucket, IOPS, Throughput, Latency)

   - Processing (Queued/Running Jobs, Avg Processing Time, Failures)

   - Token Usage (Tokens/day, Cost per Model, Error Rate, Rate Limits)

   - General / SLA (Availability %, 4xx/5xx Errors, Peak Usage, Growth Trend)

3. Interactivity & Drill-down: Clicking any aggregated card opens a detail modal/drawer with resource-level breakdowns.

4. Alerts & Thresholds: Automatic visual highlighting (Yellow for warning, Red for critical) with hover/badge suggested actions (e.g., "Increase storage capacity", "Optimize query").

5. Mock Data Engine: Fully self-contained mock data generator providing realistic 24-hour time-series datasets for all metrics.

Deliverable:

Provide a modular React (TypeScript) codebase structure with top-level Dashboard page, ApexChart wrappers, filter bar, and alert badges.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a021fdf3-e4d4-4e50-8cbc-d20004dc3aea).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
