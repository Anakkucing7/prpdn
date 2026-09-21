# PRPDN frontend

Phase 1: institutional application shell and interactive component foundation.

## Run locally

Use Node.js 20.9 or later and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000/admin/foundation.

```sh
npm run lint
npm run typecheck
npm run build
```

## Scope

The foundation route demonstrates buttons, fields, filters, tabs, status badges,
short forms, confirmations, drawers, and loading/empty/error states. Other admin
routes contain explicit phase placeholders only. There is no dashboard content,
authentication, API, database, production import engine, or permanent persistence.

All interactions use React session state. Refreshing restores fixtures. No data
is written to the source workbook. Navigation state is reflected in the route.

## Structure

- `src/app`: routing, layout and global design tokens.
- `src/components/app-shell.tsx`: grouped desktop and mobile navigation.
- `src/components/page-header.tsx`: breadcrumb and header composition.
- `src/components/ui`: shadcn/Radix primitives with institutional styling.
- `src/components/ui-patterns.tsx`: select fields, status, confirmation and detail patterns.
- `src/components/foundation.tsx`: component demonstration surface.
- `src/components/form-example.tsx`: explicitly local demonstration forms.
- `src/components/region-example.tsx`: small filter/table demonstration, not a CRUD page.
- `src/data/fixtures.ts`: four source-derived regions and a labelled demo identity.

## Fixture conventions

Region codes are strings. Original workbook labels and sheet row references are
retained. `active` comes from the source; it does not certify geometry validity.
Unknown values stay unavailable rather than becoming zero or invented timestamps.
Demo operational status is separate from source records. Year choices in the form
reflect IDSD availability (2022–2024); 2025 is explicitly disabled.

This is a four-row sample, not national coverage. It comes from `dim_wilayah`,
rows 2, 3, 27689 and 43794. No workbook transformation pipeline was created.

## Design

Follow `docs/DESIGN_DIRECTION.md`: Inter, navy navigation, neutral surfaces, blue
actions, restrained semantic colors, 6–12px radii, thin borders, visible focus.
Inter is bundled locally. The PRPDN wordmark is text, not a recreated BRIN logo.
Desktop navigation collapses to a rail; below 1280px it becomes a modal drawer.
Small-screen tables scroll inside their container, keeping page width stable.

MapLibre, ECharts and TanStack Table remain the agreed later-phase libraries;
they are intentionally not installed for this foundation-only phase.
