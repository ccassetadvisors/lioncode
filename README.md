# C&C Asset Advisors — ccassetadvisors.com

Production static site. No build step, no framework, no dependencies — deploy the
repo root to any static host (Netlify, Vercel, Cloudflare Pages, S3+CloudFront, GitHub Pages).

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home — cinematic scroll experience (cold open, reel, firm, buyers/sellers, mirror, contact) |
| `sell.html` | Sellers — honest pricing + the five-step listing launch |
| `buy.html` | Buyers — interactive first-home cost calculator, TSAHC, FAQ |
| `commercial.html` | Commercial — hub-and-spoke partnership model |
| `private-clients.html` | Portfolio advisory |
| `firm.html` | The partners, the operation, the bench |
| `404.html` | Not-found page (wire to your host's 404 setting) |

## Performance notes

- All video is **H.264 / 24fps / faststart** (the originals were HEVC, which most
  browsers can't hardware-decode — that was the source of the stutter). 30.8 MB of
  source video became 15 MB, split across pages; below-fold video lazy-loads and
  pauses off-screen.
- Fonts are self-hosted latin-subset variable WOFF2 (~132 KB total, preloaded).
- Stills/posters are frames extracted from the firm's own footage, each ≤ 140 KB.
- All scroll choreography runs in a single rAF-throttled handler; transforms only.
- `prefers-reduced-motion` is respected across the site.

## Before launch

1. **Contact form endpoint** — `js/site.js`, `CC.wireInquiry`: set `ENDPOINT` to your
   HubSpot / Formspree / backend URL (POSTs JSON). Until then it falls back to a
   prefilled `mailto:` to dalton@ccassetadvisors.com, so no inquiry is ever lost.
2. **Domain** — canonical URLs, sitemap, and OG tags assume `https://ccassetadvisors.com/`.
   Search-replace if the domain differs.
3. **Market Notes** — the subscribe form also uses the mailto fallback; swap in your
   email-list provider when ready.
4. Submit `sitemap.xml` in Google Search Console after DNS cutover.

## Source

`_source/` holds the original `.dc.html` design-canvas prototypes this build was
ported from (they required a proprietary runtime and HEVC video; kept for reference only).
