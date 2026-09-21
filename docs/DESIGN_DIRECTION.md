# DESIGN_DIRECTION — PRPDN

> **Project:** PRPDN — Dashboard Spasial Terintegrasi Indikator Pembangunan Daerah  
> **Design Positioning:** Modern Government Analytics  
> **Applies To:** Public analytics UI + Admin/data-management UI  
> **Reference:** `docs/PRD.md`, `docs/FRONTEND_SCOPE.md`, supervisor screenshots  
> **Status:** Direction for frontend implementation

---

# 1. Design Intent

PRPDN harus terasa seperti **platform analitik pemerintahan modern** — bukan SaaS marketing dashboard, bukan template admin generik, dan bukan UI eksperimental.

Kesan utama yang harus muncul:

```text
Institutional
Credible
Modern
Calm
Precise
Data-centric
Efficient
Professional
Indonesian-government appropriate
```

User harus merasa:

> “Ini sistem data resmi yang serius, modern, dan mudah digunakan.”

Bukan:

> “Ini dashboard template AI yang diberi logo instansi.”

---

# 2. Relationship to Supervisor References

Screenshot pembimbing digunakan sebagai **functional reference**.

Pertahankan ide yang memang berguna:

- sidebar berkelompok;
- dashboard overview;
- tabel data;
- search/filter;
- KPI summary;
- right-side detail panel;
- import wizard;
- validation overview;
- status badge;
- spatial/map preview;
- clear primary actions.

Jangan menyalin secara literal:

- gradient header yang dominan;
- terlalu banyak warna pastel per card;
- card treatment yang berulang;
- typography yang terlalu kecil;
- spacing yang terlalu rapat;
- semua informasi dibungkus card;
- shadow/dekorasi yang tidak membantu hierarchy.

Targetnya adalah **meningkatkan struktur yang sudah bagus, bukan mengganti domain pattern yang sudah logis**.

---

# 3. Core Design Principles

## 3.1 Clarity Before Decoration

Elemen visual harus membantu user:

- menemukan informasi;
- memahami status;
- membandingkan nilai;
- mengambil tindakan;
- membaca data.

Jika dekorasi tidak membantu salah satu hal tersebut, pertimbangkan untuk menghapusnya.

---

## 3.2 Dense but Readable

PRPDN adalah aplikasi data, sehingga boleh lebih dense daripada website marketing.

Namun density harus datang dari:

- grid yang rapi;
- row height efisien;
- typography terstruktur;
- grouping yang jelas;

bukan dari:

- font sangat kecil;
- spacing acak;
- terlalu banyak separator;
- semua elemen saling berdesakan.

---

## 3.3 Institutional, Not Boring

Government UI tidak harus terlihat tua atau kaku.

Modernisasi dilakukan melalui:

- whitespace;
- typography;
- hierarchy;
- interaction quality;
- precise layout;
- subtle motion;
- clean data visualization.

Bukan melalui:

- neon;
- glassmorphism;
- flashy gradient;
- exaggerated animation.

---

## 3.4 Color Has Meaning

Warna terutama digunakan untuk:

- brand;
- action;
- status;
- data visualization;
- selection;
- focus.

Jangan memberi setiap card warna berbeda hanya supaya “menarik”.

---

## 3.5 Consistency Builds Trust

Komponen yang memiliki fungsi sama harus:

- terlihat sama;
- behave sama;
- memiliki spacing sama;
- memiliki label pattern sama.

Credibility pada dashboard institusional sangat bergantung pada consistency.

---

# 4. Visual Personality

Gunakan karakter visual berikut:

| Trait | Direction |
|---|---|
| Formality | Professional, tidak kaku |
| Density | Medium-dense |
| Tone | Calm & confident |
| Decoration | Minimal |
| Corners | Subtle rounding |
| Shadows | Sangat ringan |
| Borders | Aktif digunakan untuk hierarchy |
| Color | Restrained |
| Typography | Clear, neutral, modern |
| Motion | Fast, subtle, functional |
| Charts | Analytical, not decorative |

---

# 5. Proposed Color System

> Nilai berikut adalah **proposed frontend tokens**, bukan klaim warna brand resmi BRIN. Jika tersedia official BRIN brand guideline, token brand harus disesuaikan.

## 5.1 Neutrals

```text
Background         #F6F8FB
Surface            #FFFFFF
Surface Subtle     #F9FAFC
Border             #E4E8F0
Border Strong      #D4DAE5

Text Primary       #172033
Text Secondary     #475569
Text Muted         #697386
Text Disabled      #98A2B3
```

---

## 5.2 Primary

Gunakan deep blue/navy sebagai primary institutional tone.

```text
Primary 900        #0B2743
Primary 800        #123A63
Primary 700        #165087
Primary 600        #1769C2
Primary 500        #1976D2
Primary 100        #EAF3FC
Primary 50         #F4F8FD
```

Primary 900/800 cocok untuk:

- sidebar;
- strong header;
- selected navigation.

Primary 600/500 cocok untuk:

- primary button;
- selected tabs;
- links;
- focus/action.

---

## 5.3 BRIN Red Accent

BRIN red dapat digunakan sebagai **brand accent kecil**, terutama dekat identitas/logo.

Jangan menjadikan merah sebagai primary interaction color.

Gunakan hanya untuk:

- brand detail;
- destructive state jika sesuai;
- emphasis yang sangat terbatas.

---

## 5.4 Semantic Colors

```text
Success            Green
Warning            Amber
Error              Red
Info               Blue
Planning/Secondary Violet/Indigo
Neutral            Slate
```

Setiap status harus memiliki:

- warna;
- icon atau symbol jika perlu;
- text label.

Jangan mengandalkan warna saja.

---

# 6. Typography

## 6.1 Font

Gunakan satu font utama.

Prioritas:

```text
Inter
Geist
Plus Jakarta Sans
```

Jika project sudah menggunakan salah satunya, jangan mengganti tanpa alasan.

---

## 6.2 Type Scale

Rekomendasi desktop:

```text
Page Title          26–30px / 700
Section Title       18–20px / 650–700
Card Title          14–16px / 600–650
Body                14px / 400–500
Table Body          13–14px / 400–500
Label               12–13px / 500–600
Meta / Caption      12px / 400–500
KPI Value           24–32px / 650–750
```

Gunakan hierarchy melalui:

- size;
- weight;
- spacing;
- color.

Bukan semua heading dibuat sangat besar.

---

# 7. Spacing System

Gunakan spacing scale konsisten:

```text
4
8
12
16
20
24
32
40
48
```

Default layout rhythm:

- control gap: `8–12px`
- card internal padding: `16–20px`
- section gap: `20–24px`
- major page section: `24–32px`

Dashboard dense boleh menggunakan spacing lebih kecil selama readability tetap baik.

---

# 8. Border Radius

Gunakan radius yang restrained.

```text
Input / Button      6–8px
Badge               999px hanya untuk compact status
Card                8–10px
Large Panel         10–12px
Modal / Drawer      10–12px
```

Hindari:

```text
24px
28px
32px
```

pada hampir semua elemen.

---

# 9. Shadows and Elevation

Gunakan border sebagai hierarchy utama.

Shadow:

- subtle;
- low blur/opacity;
- hanya untuk elevation nyata.

Contoh penggunaan:

- floating menu;
- modal;
- drawer;
- sticky popover.

Card dashboard biasa sebaiknya:

```text
1px border
+
very subtle shadow atau tanpa shadow
```

---

# 10. Application Shell

## 10.1 Sidebar

Sidebar desktop:

- dark navy;
- fixed/sticky;
- high contrast;
- grouped navigation;
- clear selected state;
- icon konsisten;
- expandable sections hanya jika memiliki children.

Gunakan separator berbasis spacing dan section label, bukan garis di mana-mana.

Selected item:

- lighter navy/blue surface;
- strong text;
- optional subtle left indicator.

Hindari glow.

---

## 10.2 Header / Top Bar

Gunakan header yang lebih restrained daripada screenshot reference.

Prefer:

- solid deep blue / navy;
- atau neutral surface jika layout sudah memiliki dark sidebar.

Jangan gunakan dramatic gradient.

Top bar berisi hanya yang memang berguna:

- project/system name;
- global search jika digunakan;
- notification;
- user menu;
- optional current context.

Tanggal/jam tidak harus menjadi elemen dominan.

---

## 10.3 Page Header

Pattern:

```text
Breadcrumb
Page Title
Short description
                       Actions
```

Primary action maksimum satu yang paling menonjol.

Secondary actions gunakan:

- outline;
- ghost;
- dropdown.

Jangan membuat 4 tombol sama kuatnya.

---

# 11. Surface Hierarchy

Gunakan tiga level visual utama:

```text
Page Background
    ↓
Section / Container
    ↓
Interactive Surface / Row
```

Tidak semua area harus card.

Contoh:

- KPI: card;
- filters: bisa satu toolbar surface;
- chart groups: panel/card;
- table: large surface;
- breadcrumbs: tanpa card;
- heading: tanpa card.

Tujuan: menghindari **card soup**.

---

# 12. Dashboard Direction

Dashboard harus membaca seperti sebuah **analytical briefing**, bukan grid widget acak.

Recommended order:

```text
Page Context / Filters
↓
Core KPIs
↓
Primary Spatial View
↓
Ranking / Coverage Context
↓
Trend / Pillar / Analytical Charts
↓
Recent Activity / Metadata
```

## KPI Cards

Gunakan 4–6 KPI utama.

KPI card tidak perlu masing-masing memiliki background warna berbeda.

Prefer:

- white/neutral card;
- semantic icon accent;
- small trend/status indicator.

Colorful tinted surface hanya untuk informasi yang benar-benar membutuhkan category distinction.

---

# 13. Data Wilayah Direction

Desktop ideal:

```text
Filters
↓
┌─────────────────────┬─────────────────────────┐
│ Region Table        │ Map / Spatial Preview   │
│                     │                         │
│                     ├─────────────────────────┤
│                     │ Selected Region Detail  │
└─────────────────────┴─────────────────────────┘
```

Gunakan selected-row state untuk menghubungkan:

```text
table
↔
map
↔
detail
```

Detail tidak perlu penuh dengan decorative cards.

Gunakan definition-list/table style untuk metadata.

---

# 14. Data IDSD Direction

Prioritaskan:

1. filter context;
2. summary;
3. data table;
4. selected detail;
5. 12-pillar context jika relevan.

Jangan membuat terlalu banyak colorful KPI card.

Gunakan badge untuk kategori:

- tinggi;
- sedang;
- rendah;

tetapi nilai numerik harus tetap lebih dominan daripada warna kategori.

---

# 15. Master Data Direction

Master Indikator dan Master Tahun adalah **management surfaces**.

Prioritaskan:

- table readability;
- quick scanning;
- detail drawer;
- clear add/edit actions;
- active/inactive state.

Dashboard-like KPI summary boleh ada jika benar-benar membantu, tetapi jangan dipaksakan.

Tidak semua master page membutuhkan empat summary card.

---

# 16. Import Flow Direction

Import harus terasa seperti workflow, bukan satu halaman penuh informasi sekaligus.

Recommended:

```text
1 Upload
2 Mapping
3 Validate
4 Review
5 Complete
```

Gunakan stepper yang understated.

Upload dropzone:

- simple;
- clear file requirement;
- visible selected file;
- avoid giant illustration.

Mapping UI:

- source column;
- target field;
- confidence/status.

Validation summary:

- valid;
- error;
- duplicate;
- empty;
- warning.

Tunjukkan error secara action-oriented.

---

# 17. Validation Direction

Validation adalah halaman problem-solving.

Prioritaskan:

```text
What is wrong?
Where?
Why?
How do I fix it?
```

Layout desktop:

```text
Summary
Filters
┌────────────────────────────┬─────────────────────┐
│ Validation Table           │ Error Detail        │
│                            │                     │
└────────────────────────────┴─────────────────────┘
Bulk actions
```

Error detail harus jelas dan tenang, bukan alarm merah besar.

Gunakan red untuk identifier/action, bukan memenuhi seluruh panel.

---

# 18. User Management Direction

Table adalah pusat halaman.

Detail user dapat dibuka melalui drawer.

Role dapat menggunakan badge warna restrained.

Actions:

- edit;
- reset password;
- deactivate;

harus memiliki hierarchy berbeda.

Destructive action jangan memiliki visual weight yang sama dengan primary edit action.

---

# 19. Filters

Filter area sebaiknya terlihat seperti **control bar**, bukan sekumpulan floating card.

Recommended:

```text
Label
Select/Input
```

Desktop:

- 3–5 filter per row;
- aligned baseline;
- reset di ujung.

Advanced filter bisa masuk:

```text
More Filters
```

Jika filter sangat banyak.

---

# 20. Inputs and Forms

Input default:

- height sekitar 36–40px pada dense desktop;
- border neutral;
- focus ring blue;
- clear error state.

Textarea hanya jika konten memang panjang.

Radio/checkbox:

- label clickable;
- spacing cukup;
- keyboard accessible.

Form panjang dibagi berdasarkan section, bukan satu card untuk setiap field.

---

# 21. Buttons

Hierarchy:

```text
Primary
Secondary
Ghost
Destructive
```

Primary:

- solid blue;
- satu action utama per area.

Secondary:

- neutral/outline.

Destructive:

- red text/border;
- solid red hanya untuk confirmation critical jika perlu.

Icon-only button wajib memiliki:

- tooltip;
- accessible label;
- hit area yang cukup.

---

# 22. Tables

Government data UI sangat bergantung pada table quality.

Table style:

- white surface;
- subtle header background;
- clear numeric alignment;
- compact but readable row;
- subtle horizontal dividers;
- hover state;
- selected state;
- sticky header jika panjang.

Numeric columns:

```text
right-aligned
```

Identity/text columns:

```text
left-aligned
```

Actions:

- right-aligned;
- gunakan icon secara konsisten.

Jangan membuat semua cell menjadi badge.

---

# 23. Status Badges

Gunakan badge hanya untuk status/category.

Examples:

```text
Aktif
Nonaktif
Valid
Error
Duplikat
Perencanaan
Arsip
Tinggi
Sedang
Rendah
```

Pattern:

```text
small semantic dot/icon + short label
```

Hindari oversized pills.

---

# 24. Charts

Chart harus mengikuti prinsip:

```text
Meaning > Decoration
```

Rules:

- grid line subtle;
- axis readable;
- unit visible;
- tooltip concise;
- selected/highlight state clear;
- neutral default series;
- accent only where meaningful.

Jangan menggunakan rainbow palette.

Gunakan palette konsisten antarhalaman.

---

# 25. Map

Map adalah first-class analytical surface.

Gunakan choropleth dengan:

- perceptually ordered scale;
- legend;
- no-data color;
- hover tooltip;
- selected outline;
- clear level switch;
- restrained basemap.

Map tidak boleh kalah oleh UI chrome.

Popup/tooltip:

```text
Wilayah
Indicator
Value
Year
Category
Change
```

Tidak perlu berisi semua metadata sekaligus.

---

# 26. Data Visualization Color Strategy

Gunakan kategori warna berdasarkan makna, bukan dekorasi.

Contoh:

```text
Primary series      Blue
Positive            Green
Warning             Amber
Negative/Error      Red
Secondary series    Indigo/Teal
No data             Gray
```

Untuk choropleth gunakan continuous sequential scale.

Untuk categorical chart, batasi jumlah warna.

---

# 27. Detail Panels / Drawers

Drawer cocok untuk preserving context.

Width desktop yang direkomendasikan:

```text
360–480px
```

Tergantung konten.

Structure:

```text
Entity Header
Status
Key facts
Tabs if necessary
Metadata
Actions
```

Jangan memasukkan tabs jika hanya ada sedikit informasi.

---

# 28. Icons

Gunakan satu icon set yang konsisten.

Prefer existing project icon library.

Rules:

- jangan campur outline/filled secara random;
- ukuran konsisten;
- icon tidak menggantikan label penting;
- avoid emoji;
- avoid sparkle/decorative AI iconography.

---

# 29. Motion

Motion harus functional.

Recommended duration:

```text
120–220ms
```

Gunakan untuk:

- hover;
- drawer;
- dropdown;
- tab;
- selection;
- small state transition.

Hindari:

- bouncing;
- floating decoration;
- long animation;
- stagger berlebihan;
- animated gradients.

---

# 30. Loading States

Gunakan skeleton yang mengikuti bentuk konten.

Examples:

- KPI skeleton;
- table rows;
- chart placeholder;
- map placeholder;
- drawer skeleton.

Jangan hanya menulis:

```text
Loading...
```

untuk page utama.

---

# 31. Empty States

Empty state harus informatif dan pendek.

Pattern:

```text
Belum ada data untuk kombinasi filter ini.

[Reset filter]
```

Jika ada next action yang jelas, tampilkan.

Tidak perlu illustration besar.

---

# 32. Error States

Gunakan tone professional.

Pattern:

```text
Data gagal dimuat.
Periksa koneksi atau coba kembali.

[Coba Lagi]
```

Jangan menampilkan stack trace pada UI.

---

# 33. Responsive Strategy

## Desktop >= 1280px

Primary target.

- full sidebar;
- multi-column dashboard;
- table first;
- map and detail side-by-side;
- dense analytics layout.

## Tablet 768–1279px

- collapsible sidebar;
- 2-column cards;
- map full/large width;
- tables horizontal scroll jika perlu;
- detail drawer overlay.

## Mobile < 768px

Mobile harus usable, tetapi bukan target utama untuk analytical power-user workflow.

- navigation drawer;
- filter drawer;
- charts stacked;
- KPI 1–2 columns;
- horizontal table scroll/card fallback;
- map tetap usable.

Jangan memaksakan desktop density ke mobile.

---

# 34. Accessibility

Minimum:

- visible focus;
- keyboard navigation;
- label pada input;
- accessible names untuk icon button;
- contrast cukup;
- status tidak hanya warna;
- error text jelas;
- chart memiliki textual context;
- clickable row tidak menjadi satu-satunya cara melakukan action.

---

# 35. Anti “AI Dashboard” Rules

Jangan lakukan:

```text
❌ blue-purple gradient everywhere
❌ glassmorphism
❌ glowing border
❌ giant rounded cards
❌ huge marketing headline
❌ “Welcome back, Admin 👋”
❌ random sparkles
❌ excessive pastel KPI cards
❌ decorative blob backgrounds
❌ excessive shadows
❌ card inside card inside card
❌ random emoji
❌ fake generic copywriting
❌ unnecessary animation
❌ every metric with a different color
```

Jika sebuah UI terlihat seperti landing-page template SaaS, redesign.

---

# 36. What “Modern Government” Means Here

Modern government UI bukan berarti flashy.

Gunakan:

```text
strong hierarchy
clear typography
high-quality tables
calm navigation
reliable feedback
consistent controls
accessible interactions
clear provenance
data-first composition
restrained branding
```

Modernitas datang dari **execution quality**, bukan visual gimmick.

---

# 37. Screen-Level Visual Priority

## Dashboard

```text
Spatial overview
>
core KPI
>
trend/analysis
>
ranking
>
activity
```

## Data Wilayah

```text
Find region
>
understand spatial status
>
inspect detail
>
take action
```

## Data IDSD

```text
Filter context
>
score data
>
category/source
>
detail/pillars
>
edit
```

## Import

```text
Current step
>
file/mapping state
>
validation
>
next action
```

## Validasi

```text
Problem count
>
affected row
>
error reason
>
fix action
```

## Master / Users

```text
Search
>
table scan
>
status
>
detail
>
management action
```

---

# 38. Design Review Checklist

Sebelum satu page dianggap selesai, cek:

- Apakah hierarchy jelas dalam 3 detik?
- Apakah primary action mudah ditemukan?
- Apakah page terlalu banyak card?
- Apakah warna dipakai karena makna?
- Apakah spacing konsisten?
- Apakah table mudah discan?
- Apakah detail dapat dilihat tanpa kehilangan context?
- Apakah empty/error/loading state tersedia?
- Apakah mobile/tablet tidak rusak?
- Apakah button hierarchy jelas?
- Apakah icon memiliki fungsi?
- Apakah page terlihat institutional?
- Apakah ada bagian yang terlihat “AI-generated”?
- Apakah ada gradient/decorative effect yang bisa dihapus?
- Apakah data tetap menjadi fokus?

---

# 39. Final Design Test

Sebelum menerima visual:

> Hilangkan logo BRIN dari screenshot halaman.

Kemudian tanyakan:

```text
Apakah desain ini masih terlihat seperti
platform analitik pemerintahan yang credible,
atau langsung terlihat seperti generic SaaS template?
```

Jika jawabannya generic SaaS:

> desain belum selesai.

---

# 40. Final Direction

PRPDN harus menggabungkan:

```text
Government credibility
+
modern analytical UX
+
high data readability
+
spatial exploration
+
restrained visual language
```

Target akhir bukan UI yang “ramai” atau “wow” pada pandangan pertama.

Target akhir adalah UI yang:

> **terlihat serius, modern, nyaman digunakan berjam-jam, dan membuat data pembangunan daerah terasa mudah dieksplorasi serta dapat dipercaya.**
