<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Dashboard data comes only from `src/lib/dashboard/mock-data.ts` (deterministic seeded generator); swap this module for real APIs to keep components unchanged.
- Alert severity is computed solely by `evaluate()` in `src/lib/dashboard/thresholds.ts` so cards, tabs and drill-downs stay consistent.
- ApexCharts is lazy-loaded client-side in `components/dashboard/ApexChart.tsx` because it touches `window` at import (breaks SSR).
