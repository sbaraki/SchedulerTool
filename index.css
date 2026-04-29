@media print {
  @page {
    size: 11in 17in landscape;
    margin: 0.15in;
  }

  body {
    background-color: white !important;
    color: black !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Hide all interactive UI chrome */
  .no-print,
  .no-print-lane {
    display: none !important;
  }

  /* Hide modals/overlays during print */
  .fixed.inset-0 {
    display: none !important;
  }

  /* Force backgrounds/colors to render */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  /* Flatten gradient backgrounds onto plain white so the timeline reads clearly */
  .no-print-bg,
  .timeline-root,
  .timeline-container,
  main,
  aside,
  header,
  footer,
  [class*="bg-[linear-gradient"],
  [class*="bg-gradient"] {
    background: white !important;
    background-image: none !important;
  }

  /* Project bars: keep solid red — strip the gradient but preserve background-color. */
  [role="button"][aria-label^="Project:"] {
    background-image: none !important;
    background-color: #b91c1c !important;
    border-color: black !important;
    border-width: 1.5px !important;
  }

  /* Project bar title text — bigger and high-contrast */
  [role="button"][aria-label^="Project:"] span {
    color: white !important;
    font-size: 13px !important;
    letter-spacing: 0.08em !important;
    line-height: 1.1 !important;
  }

  /* Status pill keeps its color via inline style; just bump font weight + size */
  [role="button"][aria-label^="Project:"] span[style*="background-color"] {
    font-size: 10px !important;
    padding: 2px 5px !important;
    border-color: rgba(255,255,255,0.6) !important;
  }

  /* Sidebar gallery banner — bigger, plain white */
  aside [class*="from-slate"],
  aside [class*="bg-[linear-gradient"] {
    background: white !important;
    background-image: none !important;
  }

  aside .font-bold.uppercase {
    font-size: 14px !important;
    letter-spacing: 0.12em !important;
    color: black !important;
  }

  /* Sidebar project labels — bigger */
  aside [title] {
    font-size: 12px !important;
    line-height: 1.15 !important;
  }

  /* Timeline header bars: flatten dark backgrounds, increase font sizes */
  .bg-\[\#111\], .bg-\[\#2a2a2a\] {
    background-color: white !important;
    color: black !important;
  }
  .bg-\[\#111\] *, .bg-\[\#2a2a2a\] * {
    color: black !important;
  }
  .border-\[\#333\], .border-\[\#444\] {
    border-color: #1e293b !important;
  }

  /* Year band */
  .bg-\[\#111\] > div {
    font-size: 18px !important;
    font-weight: 800 !important;
  }

  /* Month band */
  .bg-\[\#2a2a2a\] > div {
    font-size: 12px !important;
    font-weight: 700 !important;
  }

  /* FY band */
  .bg-slate-50 > div,
  .bg-slate-100 > div {
    font-size: 11px !important;
    font-weight: 700 !important;
    color: #1e293b !important;
  }

  /* Phase labels — small but legible */
  [title][class*="text-[9px]"] {
    font-size: 10px !important;
    color: black !important;
  }

  /* Borders: high contrast for paper */
  .border-slate-200, .border-slate-300 {
    border-color: #475569 !important;
    border-width: 1px !important;
  }

  .border-slate-200\/40, .border-slate-200\/10, .border-slate-200\/5 {
    border-color: #94a3b8 !important;
    border-width: 0.5px !important;
  }

  /* Drop tinted lane backgrounds — use plain white */
  .bg-orange-50\/50, .bg-orange-50,
  .bg-slate-50\/50, .bg-slate-50,
  .bg-slate-100\/50, .bg-slate-100,
  .bg-white\/40, .bg-white\/75, .bg-white\/80, .bg-white\/85, .bg-white\/95 {
    background-color: white !important;
  }

  /* Timeline page sizing — let the browser scale to fit one page */
  .timeline-root {
    display: flex !important;
    overflow: visible !important;
    height: auto !important;
    zoom: var(--print-scale, 1);
    transform-origin: top left !important;
    padding: 0 !important;
    gap: 0 !important;
  }

  .timeline-container {
    overflow: visible !important;
    height: auto !important;
    width: auto !important;
    cursor: default !important;
  }

  .sticky,
  .sticky.top-0 {
    position: relative !important;
    top: 0 !important;
  }

  .timeline-root,
  .timeline-container,
  aside,
  main {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Today indicator — keep visible but slimmer */
  .bg-red-500 {
    background-color: #b91c1c !important;
    width: 1.5px !important;
  }

  /* Milestone markers — black diamonds, no decorative chrome */
  .rotate-45 {
    border-color: black !important;
    border-width: 1.5px !important;
  }

  /* Milestone labels — strip backgrounds, bump size */
  [class*="bg-white"][class*="border-slate-200"] {
    background: transparent !important;
    border: none !important;
    font-size: 10px !important;
    color: black !important;
    font-weight: 600 !important;
  }
}
