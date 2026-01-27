#!/usr/bin/env node

/**
 * Lab Autograder — 3-2-More-CSS-main
 *
 * Marking:
 * - 80 marks for TODOs (CSS + HTML link check)
 * - 20 marks for submission timing (deadline-based)
 *   - On/before deadline => 20/20
 *   - After deadline     => 10/20
 *
 * Deadline: 28 Jan 2026 11:59 PM (Asia/Riyadh, UTC+03:00)
 *
 * Notes:
 * - Ignores HTML comments and CSS comments (so examples inside comments do NOT count).
 * - Light checks only: looks for selectors + key properties/values.
 * - Not strict: accepts common equivalents/alternatives so students don’t lose marks unfairly.
 *   Examples of accepted alternatives:
 *   - background-color OR background
 *   - white OR #fff OR #ffffff
 *   - font-weight: bold OR numeric 600–900 (depending on TODO)
 *   - spacing: rem OR close px equivalents (0.75rem ≈ 12px, 0.5rem ≈ 8px, 0.25rem ≈ 4px)
 *   - display: inline-block OR inline-flex (for inline labels)
 *   - margin-block can be replaced by margin-top/margin-bottom
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ARTIFACTS_DIR = "artifacts";
const FEEDBACK_DIR = path.join(ARTIFACTS_DIR, "feedback");
fs.mkdirSync(FEEDBACK_DIR, { recursive: true });

/* -----------------------------
   Deadline (Asia/Riyadh)
   28 Jan 2026, 11:59 PM
-------------------------------- */
const DEADLINE_RIYADH_ISO = "2026-01-28T23:59:00+03:00";
const DEADLINE_MS = Date.parse(DEADLINE_RIYADH_ISO);

// Submission marks policy
const SUBMISSION_MAX = 20;
const SUBMISSION_LATE = 10;

/* -----------------------------
   TODO marks (out of 80)
-------------------------------- */
const tasks = [
  { id: "todo0", name: "TODO 0: HTML links styles.css in <head>", marks: 6 },

  { id: "todo1", name: "TODO 1: :root variables + global box-sizing reset (*)", marks: 14 },
  { id: "todo2", name: "TODO 2: Header/Footer background + .tagline muted", marks: 8 },
  { id: "todo3", name: "TODO 3: .color-demo notes + .bg-sample block styling", marks: 16 },
  { id: "todo4", name: "TODO 4: Inline labels (.inline-label, .inline-label.alt)", marks: 10 },
  { id: "todo5", name: "TODO 5: Typography for .copy .title and .copy .intro", marks: 10 },
  { id: "todo6", name: "TODO 6: Flex toolbar/buttons + product grid/items", marks: 12 },
  { id: "todo7", name: "TODO 7: .static-box visibility styling", marks: 4 },
];

const STEPS_MAX = tasks.reduce((sum, t) => sum + t.marks, 0); // 80
const TOTAL_MAX = STEPS_MAX + SUBMISSION_MAX; // 100

/* -----------------------------
   Helpers
-------------------------------- */
function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function findFileByName(preferredName) {
  const preferred = path.join(process.cwd(), preferredName);
  if (fs.existsSync(preferred)) return preferred;

  const ignoreDirs = new Set(["node_modules", ".git", ARTIFACTS_DIR]);
  const stack = [process.cwd()];

  while (stack.length) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const e of entries) {
      const full = path.join(dir, e.name);

      if (e.isDirectory()) {
        if (!ignoreDirs.has(e.name)) stack.push(full);
      } else if (e.isFile() && e.name.toLowerCase() === preferredName.toLowerCase()) {
        return full;
      }
    }
  }
  return null;
}

function findAnyHtmlFile() {
  const preferred = path.join(process.cwd(), "index.html");
  if (fs.existsSync(preferred)) return preferred;

  const ignoreDirs = new Set(["node_modules", ".git", ARTIFACTS_DIR]);
  const stack = [process.cwd()];

  while (stack.length) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const e of entries) {
      const full = path.join(dir, e.name);

      if (e.isDirectory()) {
        if (!ignoreDirs.has(e.name)) stack.push(full);
      } else if (e.isFile() && e.name.toLowerCase().endsWith(".html")) {
        return full;
      }
    }
  }
  return null;
}

function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function mdEscape(s) {
  return String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function splitMarks(stepMarks, missingCount, totalChecks) {
  if (missingCount <= 0) return stepMarks;
  const perItem = stepMarks / totalChecks;
  const deducted = perItem * missingCount;
  return Math.max(0, round2(stepMarks - deducted));
}

/* -----------------------------
   Flexible CSS parsing (top-level)
--------------------------------
   Parses: selector { body }
   - not a full CSS parser
   - good enough for beginner CSS
-------------------------------- */
function parseTopLevelRules(css) {
  const rules = [];
  const re = /([^{}]+)\{([\s\S]*?)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const selectorText = (m[1] || "").trim();
    const body = (m[2] || "").trim();
    if (!selectorText) continue;

    const selectors = selectorText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    rules.push({ selectorText, selectors, body });
  }
  return rules;
}

function bodiesForExactSelector(rules, exactSelector) {
  const target = exactSelector.trim().toLowerCase();
  return rules
    .filter((r) => r.selectors.some((s) => s.trim().toLowerCase() === target))
    .map((r) => r.body);
}

function bodiesForSelectorPattern(rules, selectorRegex) {
  return rules.filter((r) => selectorRegex.test(r.selectorText)).map((r) => r.body);
}

function anyRuleExistsForExactSelector(rules, exactSelector) {
  return bodiesForExactSelector(rules, exactSelector).length > 0;
}

function hasDecl(body, propRegex, valueRegex) {
  if (!body) return false;
  const re = new RegExp(`${propRegex.source}\\s*:\\s*${valueRegex.source}\\s*;?`, "i");
  return re.test(body);
}

function hasAnyDecl(body, options) {
  return options.some((o) => hasDecl(body, o.prop, o.value));
}

function hasAnyProp(body, propRegex) {
  if (!body) return false;
  const re = new RegExp(`${propRegex.source}\\s*:`, "i");
  return re.test(body);
}

function normalizeHead(html) {
  const m = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  return m ? m[1] : "";
}

function hasStylesheetLinkInHead(headHtml) {
  // flexible attribute order, allows ./styles.css or styles.css
  // requires rel=stylesheet and href contains styles.css
  const linkTagRe = /<link\b[^>]*>/gi;
  const tags = headHtml.match(linkTagRe) || [];
  for (const tag of tags) {
    const relOk = /\brel\s*=\s*["']stylesheet["']/i.test(tag);
    const hrefOk = /\bhref\s*=\s*["'](\.\/)?styles\.css["']/i.test(tag);
    if (relOk && hrefOk) return true;
  }
  return false;
}

/* -----------------------------
   Determine submission time
-------------------------------- */
let lastCommitISO = null;
let lastCommitMS = null;

try {
  lastCommitISO = execSync("git log -1 --format=%cI", { encoding: "utf8" }).trim();
  lastCommitMS = Date.parse(lastCommitISO);
} catch {
  lastCommitISO = new Date().toISOString();
  lastCommitMS = Date.now();
}

/* -----------------------------
   Submission marks
-------------------------------- */
const isLate = Number.isFinite(lastCommitMS) ? lastCommitMS > DEADLINE_MS : true;
const submissionScore = isLate ? SUBMISSION_LATE : SUBMISSION_MAX;

/* -----------------------------
   Load student files
-------------------------------- */
const htmlFile = findAnyHtmlFile();
const cssFile = findFileByName("styles.css");

const htmlRaw = htmlFile ? safeRead(htmlFile) : null;
const cssRaw = cssFile ? safeRead(cssFile) : null;

const html = htmlRaw ? stripHtmlComments(htmlRaw) : null;
const css = cssRaw ? stripCssComments(cssRaw) : null;

const results = []; // { id, name, max, score, checklist[], deductions[] }

/* -----------------------------
   Result helpers
-------------------------------- */
function addResult(task, required, missing) {
  const score = splitMarks(task.marks, missing.length, required.length);
  results.push({
    id: task.id,
    name: task.name,
    max: task.marks,
    score,
    checklist: required.map((r) => `${r.ok ? "✅" : "❌"} ${r.label}`),
    deductions: missing.length ? missing.map((m) => `Missing: ${m.label}`) : [],
  });
}

function failTask(task, reason) {
  results.push({
    id: task.id,
    name: task.name,
    max: task.marks,
    score: 0,
    checklist: [],
    deductions: [reason],
  });
}

/* -----------------------------
   If files missing, grade accordingly
-------------------------------- */
if (!html) {
  failTask(
    tasks[0],
    htmlFile
      ? `Could not read HTML file at: ${htmlFile}`
      : "No .html file found (expected index.html or any .html file)."
  );
}

if (!css) {
  for (const t of tasks) {
    if (t.id === "todo0") continue;
    failTask(t, cssFile ? `Could not read CSS file at: ${cssFile}` : "No styles.css file found.");
  }
}

/* -----------------------------
   Grade TODOs (only if file present)
-------------------------------- */
if (html) {
  // TODO0: HTML link in <head>
  const head = normalizeHead(html);
  const required = [
    { label: "Has <head> section", ok: head && head.length > 0 },
    { label: 'Has <link rel="stylesheet" href="styles.css"> (or "./styles.css") inside <head>', ok: hasStylesheetLinkInHead(head) },
  ];
  const missing = required.filter((r) => !r.ok);
  addResult(tasks[0], required, missing);
}

if (css) {
  const rules = parseTopLevelRules(css);

  /* TODO1: :root variables + global box-sizing reset */
  {
    const rootBodies =
      bodiesForExactSelector(rules, ":root")
        .concat(bodiesForExactSelector(rules, "html")); // allow html { --brand: ... } as alternative

    const starBodies = bodiesForExactSelector(rules, "*")
      .concat(bodiesForSelectorPattern(rules, /\*\s*,\s*\*\s*::before\s*,\s*\*\s*::after/i))
      .concat(bodiesForExactSelector(rules, "*, *::before, *::after"));

    const brandOk = rootBodies.some((b) => /--brand\s*:\s*#2563eb\b/i.test(b));
    const brandDarkOk = rootBodies.some((b) => /--brand-dark\s*:\s*#1d4ed8\b/i.test(b));

    const boxSizingOk = starBodies.some((b) =>
      hasAnyDecl(b, [{ prop: /\bbox-sizing\b/i, value: /\bborder-box\b/i }])
    );

    const required = [
      { label: "Has :root { ... } (or html { ... }) rule for CSS variables", ok: rootBodies.length > 0 },
      { label: "Defines --brand: #2563eb", ok: brandOk },
      { label: "Defines --brand-dark: #1d4ed8", ok: brandDarkOk },

      { label: "Has * (or *, *::before, *::after) rule for global reset", ok: starBodies.length > 0 },
      { label: "Global reset sets box-sizing: border-box", ok: boxSizingOk },
    ];

    const missing = required.filter((r) => !r.ok);
    addResult(tasks[1], required, missing);
  }

  /* TODO2: header/footer background + tagline muted */
  {
    const headerBodies = bodiesForExactSelector(rules, ".site-header");
    const footerBodies = bodiesForExactSelector(rules, ".site-footer");
    const groupedBodies = bodiesForSelectorPattern(rules, /\.site-header\s*,\s*\.site-footer/i);
    const taglineBodies = bodiesForExactSelector(rules, ".tagline");

    const hfBodies = headerBodies.concat(footerBodies).concat(groupedBodies);

    const headerFooterBgOk = hfBodies.some((b) =>
      hasAnyDecl(b, [
        { prop: /\bbackground-color\b/i, value: /var\(--card\)/i },
        { prop: /\bbackground\b/i, value: /var\(--card\)/i },
      ])
    );

    const taglineMutedOk = taglineBodies.some((b) =>
      hasAnyDecl(b, [{ prop: /\bcolor\b/i, value: /var\(--muted\)/i }])
    );

    const required = [
      { label: "Has .site-header and .site-footer rule(s)", ok: headerBodies.length + footerBodies.length + groupedBodies.length > 0 },
      { label: ".site-header/.site-footer background uses var(--card) (background or background-color)", ok: headerFooterBgOk },
      { label: "Has .tagline { ... } rule", ok: taglineBodies.length > 0 },
      { label: ".tagline color uses var(--muted)", ok: taglineMutedOk },
    ];

    const missing = required.filter((r) => !r.ok);
    addResult(tasks[2], required, missing);
  }

  /* TODO3: color-note, muted, bg-sample styling */
  {
    const noteBodies = bodiesForSelectorPattern(rules, /\.color-demo\s+\.color-note\b/i);
    const mutedBodies = bodiesForSelectorPattern(rules, /\.color-demo\s+\.muted\b/i);
    const bgSampleBodies = bodiesForExactSelector(rules, ".bg-sample");

    const noteColorOk = noteBodies.some((b) =>
      hasAnyDecl(b, [{ prop: /\bcolor\b/i, value: /var\(--brand\)/i }])
    );
    const noteWeightOk = noteBodies.some((b) =>
      /font-weight\s*:\s*(bold|6\d\d|7\d\d|8\d\d|9\d\d)\b/i.test(b)
    );

    // font-size: prefer 0.95rem; accept 0.9–1.0rem OR close px (14–16px)
    const mutedColorOk = mutedBodies.some((b) =>
      hasAnyDecl(b, [{ prop: /\bcolor\b/i, value: /var\(--muted\)/i }])
    );
    const mutedFontOk = mutedBodies.some((b) =>
      /font-size\s*:\s*(0\.(9\d|95)rem|1rem|1\.0rem|1\.00rem|1\.0{1,2}rem|1\.00rem|1rem|1\.0rem|1\.00rem|1rem|1\.0rem|1\.00rem)\b/i.test(b) ||
      /font-size\s*:\s*(1[4-6](\.\d+)?px)\b/i.test(b)
    );

    // bg-sample checks (flexible, not strict on exact values)
    const bgWidthOk = bgSampleBodies.some((b) =>
      hasAnyDecl(b, [{ prop: /\bwidth\b/i, value: /100\s*%/i }])
    );
    const bgMinHeightOk = bgSampleBodies.some((b) =>
      /min-height\s*:\s*(8[0-9]|9\d|[1-9]\d{2,})px\b/i.test(b)
    );
    const bgPaddingOk = bgSampleBodies.some((b) =>
      /padding\s*:\s*(0\.75rem|12px)\b/i.test(b)
    );
    const bgMarginBlockOk = bgSampleBodies.some((b) =>
      /margin-block\s*:\s*(0\.75rem|12px)\b/i.test(b) ||
      (/margin-top\s*:\s*(0\.75rem|12px)\b/i.test(b) && /margin-bottom\s*:\s*(0\.75rem|12px)\b/i.test(b))
    );
    const bgRadiusOk = bgSampleBodies.some((b) => hasAnyProp(b, /\bborder-radius\b/i));
    const bgTextWhiteOk = bgSampleBodies.some((b) =>
      hasAnyDecl(b, [
        { prop: /\bcolor\b/i, value: /\bwhite\b/i },
        { prop: /\bcolor\b/i, value: /#fff\b/i },
        { prop: /\bcolor\b/i, value: /#ffffff\b/i },
      ])
    );
    // Require a gradient that includes var(--brand). Accept any linear-gradient, optional 135deg.
    const bgGradientOk = bgSampleBodies.some((b) =>
      /background(?:-image)?\s*:\s*linear-gradient\([^;]*var\(--brand\)[^;]*\)\s*;?/i.test(b) ||
      /background\s*:\s*linear-gradient\([^;]*var\(--brand\)[^;]*\)\s*;?/i.test(b)
    );

    const required = [
      { label: "Has .color-demo .color-note { ... } rule", ok: noteBodies.length > 0 },
      { label: ".color-note sets color: var(--brand)", ok: noteColorOk },
      { label: ".color-note sets font-weight to bold/600+", ok: noteWeightOk },

      { label: "Has .color-demo .muted { ... } rule", ok: mutedBodies.length > 0 },
      { label: ".muted sets color: var(--muted)", ok: mutedColorOk },
      { label: ".muted sets font-size around 0.95rem (accept 0.9–1rem or close px)", ok: mutedFontOk },

      { label: "Has .bg-sample { ... } rule", ok: bgSampleBodies.length > 0 },
      { label: ".bg-sample sets width: 100%", ok: bgWidthOk },
      { label: ".bg-sample sets min-height >= 80px", ok: bgMinHeightOk },
      { label: ".bg-sample sets padding around 0.75rem (or 12px)", ok: bgPaddingOk },
      { label: ".bg-sample sets margin-block around 0.75rem (or margin-top/bottom)", ok: bgMarginBlockOk },
      { label: ".bg-sample sets a border-radius (any value)", ok: bgRadiusOk },
      { label: ".bg-sample sets text color to white (#fff/white)", ok: bgTextWhiteOk },
      { label: ".bg-sample sets linear-gradient background including var(--brand)", ok: bgGradientOk },
    ];

    const missing = required.filter((r) => !r.ok);
    addResult(tasks[3], required, missing);
  }

  /* TODO4: inline labels */
  {
    const labelBodies = bodiesForExactSelector(rules, ".inline-label");
    const altBodies = bodiesForExactSelector(rules, ".inline-label.alt");

    const displayOk = labelBodies.some((b) =>
      hasAnyDecl(b, [
        { prop: /\bdisplay\b/i, value: /\binline-block\b/i },
        { prop: /\bdisplay\b/i, value: /\binline-flex\b/i },
      ])
    );

    // padding 0.25rem 0.5rem or close px
    const paddingOk = labelBodies.some((b) =>
      /padding\s*:\s*(0\.25rem|4px)\s+(0\.5rem|8px)\b/i.test(b)
    );

    // border: 1px solid rgba(0,0,0,0.18) (allow spaces)
    const borderOk = labelBodies.some((b) =>
      /border\s*:\s*1px\s+solid\s+rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.18\s*\)\s*;?/i.test(b) ||
      /border-color\s*:\s*rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.18\s*\)\s*;?/i.test(b)
    );

    const altDashedOk = altBodies.some((b) =>
      hasAnyDecl(b, [{ prop: /\bborder-style\b/i, value: /\bdashed\b/i }]) ||
      /border\s*:\s*1px\s+dashed\b/i.test(b)
    );

    const required = [
      { label: "Has .inline-label { ... } rule", ok: labelBodies.length > 0 },
      { label: ".inline-label sets display to inline-block (or inline-flex)", ok: displayOk },
      { label: ".inline-label sets padding: 0.25rem 0.5rem (or close px)", ok: paddingOk },
      { label: ".inline-label sets a 1px solid border with rgba(0,0,0,0.18) (or border-color)", ok: borderOk },

      { label: "Has .inline-label.alt { ... } rule", ok: altBodies.length > 0 },
      { label: ".inline-label.alt uses a different border style (e.g., dashed)", ok: altDashedOk },
    ];

    const missing = required.filter((r) => !r.ok);
    addResult(tasks[4], required, missing);
  }

  /* TODO5: typography for title and intro */
  {
    const titleBodies = bodiesForSelectorPattern(rules, /\.copy\s+\.title\b/i);
    const introBodies = bodiesForSelectorPattern(rules, /\.copy\s+\.intro\b/i);

    const titleSizeOk = titleBodies.some((b) => /font-size\s*:\s*\d+(\.\d+)?rem\b/i.test(b)); // any rem
    const titleWeightOk = titleBodies.some((b) => /font-weight\s*:\s*(600|650|700|bold)\b/i.test(b));
    const titleTransformOk = titleBodies.some((b) => /text-transform\s*:\s*capitalize\b/i.test(b));

    const introItalicOk = introBodies.some((b) => /font-style\s*:\s*italic\b/i.test(b));
    // slightly increased line-height: accept >= 1.6 or keywords like "normal" are NOT accepted here
    const introLineHeightOk = introBodies.some((b) =>
      /line-height\s*:\s*(?:1\.(?:6\d*|[7-9]\d*)|[2-9](?:\.\d+)?)\s*;?/i.test(b)
    );
    const introMarginTopOk = introBodies.some((b) => /margin-top\s*:\s*(0\.25rem|4px)\b/i.test(b));

    const required = [
      { label: "Has .copy .title { ... } rule", ok: titleBodies.length > 0 },
      { label: ".copy .title sets font-size using rem", ok: titleSizeOk },
      { label: ".copy .title sets font-weight 600–700 (or bold)", ok: titleWeightOk },
      { label: ".copy .title sets text-transform: capitalize", ok: titleTransformOk },

      { label: "Has .copy .intro { ... } rule", ok: introBodies.length > 0 },
      { label: ".copy .intro sets font-style: italic", ok: introItalicOk },
      { label: ".copy .intro increases line-height (>= 1.6)", ok: introLineHeightOk },
      { label: ".copy .intro sets margin-top: 0.25rem (or 4px)", ok: introMarginTopOk },
    ];

    const missing = required.filter((r) => !r.ok);
    addResult(tasks[5], required, missing);
  }

  /* TODO6: toolbar/buttons + product grid/items */
  {
    const toolbarBodies = bodiesForExactSelector(rules, ".toolbar");
    const btnBodies = bodiesForExactSelector(rules, ".btn");
    const btnHoverBodies = bodiesForSelectorPattern(rules, /\.btn\s*:\s*hover\b/i);
    const gridBodies = bodiesForExactSelector(rules, ".product-grid");
    const itemBodies = bodiesForSelectorPattern(rules, /\.product-grid\s+\.item\b/i);

    const toolbarFlexOk = toolbarBodies.some((b) =>
      hasAnyDecl(b, [
        { prop: /\bdisplay\b/i, value: /\bflex\b/i },
        { prop: /\bdisplay\b/i, value: /\binline-flex\b/i },
      ])
    );
    const toolbarJustifyOk = toolbarBodies.some((b) => /justify-content\s*:\s*space-between\b/i.test(b));
    const toolbarAlignOk = toolbarBodies.some((b) => /align-items\s*:\s*center\b/i.test(b));
    const toolbarGapOk = toolbarBodies.some((b) => /gap\s*:\s*\d+(\.\d+)?(rem|px)\b/i.test(b));

    const btnPaddingOk = btnBodies.some((b) => /padding\s*:\s*[^;]+;/i.test(b));
    const btnBorderNoneOk = btnBodies.some((b) => /border\s*:\s*(none|0)\b/i.test(b));

    // hover feedback: only require a :hover rule exists for .btn (not strict on exact properties)
    const btnHoverOk = btnHoverBodies.length > 0;

    const gridFlexOk = gridBodies.some((b) => /display\s*:\s*flex\b/i.test(b));
    const gridWrapOk = gridBodies.some((b) => /flex-wrap\s*:\s*wrap\b/i.test(b));
    const gridGapOk = gridBodies.some((b) => /gap\s*:\s*(0\.75rem|12px)\b/i.test(b));
    const gridMarginTopOk = gridBodies.some((b) => /margin-top\s*:\s*(0\.75rem|12px)\b/i.test(b));

    // item flex: accept flex shorthand OR separate flex-grow/shrink/basis OR min-width:140px
    const itemFlexOk = itemBodies.some((b) =>
      /flex\s*:\s*1\s+1\s+140px\b/i.test(b) ||
      (/flex-grow\s*:\s*1\b/i.test(b) && /flex-shrink\s*:\s*1\b/i.test(b) && /flex-basis\s*:\s*140px\b/i.test(b)) ||
      /min-width\s*:\s*140px\b/i.test(b)
    );
    const itemMinHeightOk = itemBodies.some((b) => /min-height\s*:\s*(9\d|[1-9]\d{2,})px\b/i.test(b)); // >=90px
    const itemRadiusOk = itemBodies.some((b) => /border-radius\s*:\s*\d+(\.\d+)?(px|rem)\b/i.test(b));
    const itemBgOk = itemBodies.some((b) =>
      /background(?:-color)?\s*:\s*rgba\([^;]*0\.04[^;]*\)/i.test(b) ||
      /background(?:-color)?\s*:\s*rgba\([^;]*0\.0[1-9][^;]*\)/i.test(b) ||
      /background(?:-color)?\s*:\s*#f/i.test(b) // any very light hex (soft background)
    );
    const itemCenterOk = itemBodies.some((b) =>
      /display\s*:\s*flex\b/i.test(b) &&
      /align-items\s*:\s*center\b/i.test(b) &&
      /justify-content\s*:\s*center\b/i.test(b)
    );
    const itemWeightOk = itemBodies.some((b) => /font-weight\s*:\s*(700|bold)\b/i.test(b));

    const required = [
      { label: "Has .toolbar { ... } rule", ok: toolbarBodies.length > 0 },
      { label: ".toolbar uses display:flex (or inline-flex)", ok: toolbarFlexOk },
      { label: ".toolbar uses justify-content: space-between", ok: toolbarJustifyOk },
      { label: ".toolbar uses align-items: center", ok: toolbarAlignOk },
      { label: ".toolbar has a gap", ok: toolbarGapOk },

      { label: "Has .btn { ... } rule", ok: btnBodies.length > 0 },
      { label: ".btn sets padding", ok: btnPaddingOk },
      { label: ".btn removes border (border: none or 0)", ok: btnBorderNoneOk },
      { label: "Has .btn:hover { ... } rule for hover feedback", ok: btnHoverOk },

      { label: "Has .product-grid { ... } rule", ok: gridBodies.length > 0 },
      { label: ".product-grid sets display:flex", ok: gridFlexOk },
      { label: ".product-grid sets flex-wrap: wrap", ok: gridWrapOk },
      { label: ".product-grid sets gap: 0.75rem (or 12px)", ok: gridGapOk },
      { label: ".product-grid sets margin-top: 0.75rem (or 12px)", ok: gridMarginTopOk },

      { label: "Has .product-grid .item { ... } rule", ok: itemBodies.length > 0 },
      { label: ".item flexible sizing (flex: 1 1 140px OR grow/shrink/basis OR min-width:140px)", ok: itemFlexOk },
      { label: ".item sets min-height >= 90px", ok: itemMinHeightOk },
      { label: ".item sets a soft background", ok: itemBgOk },
      { label: ".item sets border-radius (any value)", ok: itemRadiusOk },
      { label: ".item centers content using flexbox", ok: itemCenterOk },
      { label: ".item sets font-weight 700 (or bold)", ok: itemWeightOk },
    ];

    const missing = required.filter((r) => !r.ok);
    addResult(tasks[6], required, missing);
  }

  /* TODO7: static box styling */
  {
    const staticBodies = bodiesForExactSelector(rules, ".static-box");

    const padOk = staticBodies.some((b) => /padding\s*:\s*(0\.5rem|8px)\s+(0\.75rem|12px)\b/i.test(b));
    const radiusOk = staticBodies.some((b) => /border-radius\s*:\s*(10px|0\.625rem)\b/i.test(b));
    const bgOk = staticBodies.some((b) => /background(?:-color)?\s*:\s*rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.05\s*\)/i.test(b));
    const mbOk = staticBodies.some((b) => /margin-bottom\s*:\s*(0\.5rem|8px)\b/i.test(b));

    const required = [
      { label: "Has .static-box { ... } rule", ok: staticBodies.length > 0 },
      { label: ".static-box sets padding: 0.5rem 0.75rem (or close px)", ok: padOk },
      { label: ".static-box sets border-radius: 10px", ok: radiusOk },
      { label: ".static-box sets background rgba(0,0,0,0.05)", ok: bgOk },
      { label: ".static-box sets margin-bottom: 0.5rem", ok: mbOk },
    ];

    const missing = required.filter((r) => !r.ok);
    addResult(tasks[7], required, missing);
  }
}

/* -----------------------------
   Final scoring
-------------------------------- */
const stepsScore = results.reduce((sum, r) => sum + r.score, 0);
const totalScore = round2(stepsScore + submissionScore);

/* -----------------------------
   Build summary + feedback
-------------------------------- */
const submissionLine = `- **Lab:** 3-2-More-CSS-main
- **Deadline (Riyadh / UTC+03:00):** ${DEADLINE_RIYADH_ISO}
- **Last commit time (from git log):** ${lastCommitISO}
- **Submission marks:** **${submissionScore}/${SUBMISSION_MAX}** ${isLate ? "(Late submission)" : "(On time)"}
`;

let summary = `# 3-2-More-CSS-main — Autograding Summary

## Submission

${submissionLine}

## Files Checked

- HTML: ${htmlFile ? `✅ ${htmlFile}` : "❌ No HTML file found"}
- CSS: ${cssFile ? `✅ ${cssFile}` : "❌ No styles.css file found"}

## Marks Breakdown

| Component | Marks |
|---|---:|
`;

for (const r of results) summary += `| ${r.name} | ${r.score}/${r.max} |\n`;
summary += `| Submission (timing) | ${submissionScore}/${SUBMISSION_MAX} |\n`;

summary += `
## Total Marks

**${totalScore} / ${TOTAL_MAX}**

## Detailed Checks (What you did / missed)
`;

for (const r of results) {
  const done = (r.checklist || []).filter((x) => x.startsWith("✅"));
  const missed = (r.checklist || []).filter((x) => x.startsWith("❌"));

  summary += `
<details>
  <summary><strong>${mdEscape(r.name)}</strong> — ${r.score}/${r.max}</summary>

  <br/>

  <strong>✅ Found</strong>
  ${done.length ? "\n" + done.map((x) => `- ${mdEscape(x)}`).join("\n") : "\n- (Nothing detected)"}

  <br/><br/>

  <strong>❌ Missing</strong>
  ${missed.length ? "\n" + missed.map((x) => `- ${mdEscape(x)}`).join("\n") : "\n- (Nothing missing)"}

  <br/><br/>

  <strong>❗ Deductions / Notes</strong>
  ${r.deductions && r.deductions.length
      ? "\n" + r.deductions.map((d) => `- ${mdEscape(d)}`).join("\n")
      : "\n- No deductions."
    }

</details>
`;
}

summary += `
> Full feedback is also available in: \`artifacts/feedback/README.md\`
`;

let feedback = `# 3-2-More-CSS-main — Feedback

## Submission

${submissionLine}

## Files Checked

- HTML: ${htmlFile ? `✅ ${htmlFile}` : "❌ No HTML file found"}
- CSS: ${cssFile ? `✅ ${cssFile}` : "❌ No styles.css file found"}

---

## TODO-by-TODO Feedback
`;

for (const r of results) {
  feedback += `
### ${r.name} — **${r.score}/${r.max}**

**Checklist**
${r.checklist.length ? r.checklist.map((x) => `- ${x}`).join("\n") : "- (No checks available)"}

**Deductions / Notes**
${r.deductions.length
      ? r.deductions.map((d) => `- ❗ ${d}`).join("\n")
      : "- ✅ No deductions. Good job!"
    }
`;
}

feedback += `
---

## How marks were deducted (rules)

- HTML comments are ignored (examples in comments do NOT count).
- CSS comments are ignored (examples in comments do NOT count).
- Checks are intentionally light: they look for key selectors and the presence of key properties.
- CSS rules can be in ANY order, and repeated selectors/properties are allowed.
- Accepted alternatives include:
  - \`background\` or \`background-color\`
  - \`white\` or \`#fff\` or \`#ffffff\`
  - \`inline-block\` or \`inline-flex\` where appropriate
  - spacing: \`0.75rem\` ~ \`12px\`, \`0.5rem\` ~ \`8px\`, \`0.25rem\` ~ \`4px\`
  - \`margin-block\` may be replaced by \`margin-top\` and \`margin-bottom\`
- Missing required items reduce marks proportionally within that TODO.
`;

/* -----------------------------
   Write outputs
-------------------------------- */
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);

const csv = `student,score,max_score
all_students,${totalScore},${TOTAL_MAX}
`;

fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
fs.writeFileSync(path.join(ARTIFACTS_DIR, "grade.csv"), csv);
fs.writeFileSync(path.join(FEEDBACK_DIR, "README.md"), feedback);

console.log(
  `✔ Lab graded: ${totalScore}/${TOTAL_MAX} (Submission: ${submissionScore}/${SUBMISSION_MAX}, TODOs: ${stepsScore}/${STEPS_MAX}).`
);
