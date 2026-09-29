# Dashboard shell specification

Reason: preserve the source dashboard shell in React and give later view builders exact visual and responsive contracts.

## Authority

Source: `/home/prof/dev/softplan-clone/dashboard_compras_softplan_jan_jul_2026.html`. References: `docs/design-references/source-desktop.png` (1440×900) and `source-mobile.png` (390×900). Source CSS and settled browser computed styles are authoritative; font network success was not independently verified.

## Tokens and baseline

| Token | Value |
|---|---|
| `--bg` / `--c100` | `#181A27` |
| `--panel` / `--c80` | `#2B2F47` |
| `--panel-2` | `#343A57` |
| `--roxo` | `#5C5CFF` |
| `--roxo-700` / `--roxo-400` / `--roxo-200` / `--roxo-100` | `#4141E0` / `#8B8BFF` / `#B9B9FF` / `#D6D6FF` |
| `--c60` / `--c40` / `--c20` | `#9196AD` / `#DCDEEA` / `#F1F2F7` |
| `--txt-3` | `#9AA0B6` |
| `--line` / `--line-soft` | `rgba(145,150,173,.20)` / `rgba(145,150,173,.11)` |
| `--r` / `--r-md` / `--r-sm` / `--r-xs` | `20px 0 20px 0` / `14px 0 14px 0` / `9px 0 9px 0` / `6px 0 6px 0` |

Body uses Sora, fallback `Segoe UI`, system UI, `-apple-system`, sans-serif; 13.5px, weight 400, line-height 1.5, tabular numerals, antialiasing. Load Sora weights 200–700 through `next/font/google`; expose `--font-sora`.

## Shell

- Decorative mosaic: SVG viewBox `0 0 1560 22`, width 100%, height 22px; ten source paths, `preserveAspectRatio="none"`.
- Topbar: sticky at `top: 0`, `z-index: 40`, `rgba(24,26,39,.93)`, 14px backdrop blur, 1px bottom border. Inner max-width 1560px; padding 15px 24px; flex gap 18px, wrap.
- Brand mark: 24px square, purple, `8px 0 8px 0` radius; title 15.5px/600, nowrap; subtitle 11px.
- Tabs: max-width 1560px; padding 0 24px; flex gap 4px; horizontal auto overflow with hidden scrollbar. Buttons nowrap, 12.5px, padding 12px 13px; active label white/600 with 2px purple bottom border.
- Filters: background `#181A27`; inner max-width 1560px; padding 13px 24px; flex, 18px gap, bottom-aligned, wrapping. Controls use 175px minimum width; search uses 240px.
- Main wrapper: max-width 1560px; centered; padding 24px 24px 64px. Two-column cards use `repeat(auto-fit,minmax(420px,1fr))`; `.span-2` collapses at 980px; `.subgrid` stacks at 820px.
- Charts: 292px high, `.tall` 392px. At 640px: chart 255px, tall chart 330px; wrapper padding 18px 15px 52px; shell horizontal padding 15px; KPI values 24px.

## Responsive correction

Source `.cards-2` keeps a 420px minimum track at a 390px viewport: content width is 360px, card track is 420px, and document width becomes 435px. Clone must cap the mobile track to the container; page-level horizontal overflow is forbidden. Tabs and table wrappers retain their own horizontal scrolling.

## Verification

- `npm run typecheck` after shell implementation.
- Browser smoke at 1440×900, 768×900, and 390×900; compare source screenshots and computed styles.
- Clone acceptance at 390px: `document.documentElement.scrollWidth === 390`; only tabs and table wrappers may scroll horizontally.
