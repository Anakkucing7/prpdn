# Phase 5.6 — Spatial and public experience

## Phase 5.7 refinement

Public exploration, Data Wilayah and Dashboard share code-based regional matching and dependent controls. Level selection remains outside collapsible filters. Switching level clears incompatible parent/type/child selections; changing parent or type clears the selected child. A specific region selection highlights and zooms its polygon while keeping peers available for comparison. The province-to-kabupaten/kota shortcut is optional.

Dashboard now supports both levels. Kabupaten/kota IDSD and pilar values use exact code matches and omit conflicting/mapped pilar groups. The current dashboard fixture does not provide lower-level KFD, EPPD or poverty: these remain unavailable, not inherited from the parent province. Public and admin trend cohorts follow the selected level and parent/type scope. Recorded zero values are retained and require source interpretation.

Public hero geography reuses the existing Natural Earth asset. No official logo asset was found in project asset locations; the public header uses the PRPDN name as text, not an invented logo. Primary public copy uses human-readable sources. Login/register demo and future server/API authorization requirements below remain unchanged.

## Official spatial reference

The display snapshot uses [BIG's administrative boundary service](https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/BATAS_KABKOTA_AR/MapServer), layer 0, edition **June 2026**, retrieved 23 September 2026. Source metadata: `TASWIL5000020260612KABKOTA`. Administrative totals agree with the [Kemendagri reference](https://ppid.kemendagri.go.id/storage/dokumen/tKN00jt8OLIwOxy1QTtlvJ8fVcvCrCiCaMG0f5dI.pdf): 38 provinces, 416 kabupaten (including one administrative kabupaten), and 98 kota (including five administrative cities).

Join `KDPKAB`/`KDPPUM` to workbook region codes after removing dots. These are Kemendagri/PUM codes, not BPS codes; never interchange the namespaces or join by array position. Official names are used for display; workbook names and metadata remain in the source fixtures. Kota is a type within kabupaten/kota, not a separate hierarchy.

The service returned 541 features, representing 514 distinct coded kabupaten/kota plus uncoded features. Multiple geometries for the same code are unioned, retaining islands. Twenty-one uncoded features cannot safely be assigned and are recorded in `src/data/spatial-reference.json`. Province geometry is the union of coded child geometries. All 552 represented regions have geometry; this does not certify complete island coverage or legal boundary accuracy. Geometry is generalized at 0.002 degrees for display.

Previously missing Jambi, Sulawesi Tengah, Gorontalo, Maluku Utara, Papua Barat Daya, Papua Barat and Papua Tengah boundaries were caused by truncated workbook path strings (32,765 characters), not a name-based repair opportunity. The workbook is unchanged. The old map also rendered only the selected polygon; the shared map now renders all filtered polygons and uses a selected outline. Missing geometry retains a point where available and is explicitly labelled.

Regenerate with `node scripts/update-spatial-reference.mjs` or pass a downloaded GeoJSON response as the first argument for offline generation. The script validates counts, parent codes, edition metadata and the seven regression cases before writing. `polygon-clipping` is a development-only preprocessing dependency. Workbook extraction no longer overwrites an installed official geometry snapshot.

## Public and analytical behavior

`/` contains public data/map exploration and source context; `/login` and `/register` demonstrate entry flows. Public navigation and layout are separate from `/admin/*`. Admin navigation links to the public site; the internal foundation route remains accessible but is not a normal menu item. No publication records are invented.

Public province indicators reuse IDSD, KFD, EPPD and poverty data; kabupaten/kota exploration currently exposes IDSD. Public IDSD requires an exact code match, collapses identical duplicate values, and leaves conflicts unavailable. Source years are 2022–2024 where available; current boundaries do not imply historical territorial equivalence. Missing observations remain missing and recorded zero remains zero.

Deltas compare the same region/indicator/period with the immediately preceding year, never the previous available year across a gap. Numeric direction and evaluation are separate. No desired direction is supplied by current metadata, so all displayed movements are neutral. Tiny nonzero movements are labelled below 0.01 rather than falsely displayed as zero. Dashboard average deltas require matching provincial coverage. The public trend uses a fixed cohort with observations throughout its displayed years, explicitly labelled as an unweighted provincial average, not an official national index.

## Authentication boundary

The entry forms use fictitious names/emails and no passwords, network requests, account storage or authentication tokens. Demo public selection and registration lead to `/`; demo Admin/Super Admin selections lead to `/admin/dashboard`. This is navigation only; direct admin URLs are not protected in the prototype.

Production must authenticate users and enforce roles on the server/API for every protected operation. Public accounts must never be granted administrative access by a client-selected role. Future architecture remains Next.js → Backend/API → Prisma → MySQL, replacing fixtures/local operations without rebuilding the interface. Real authentication, persistence, validation/import execution and historical boundary versioning are deferred. Phase 6 is not included.
