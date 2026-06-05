import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const jsonPath = join(root, 'src/data/predefinedTemplates.json')

const RESPONSIVE_STYLES = `<style type="text/css">
  #outlook a { padding: 0; }
  body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
  table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  td { word-wrap: break-word; }
  .num { word-break: break-word; }
  @media screen and (max-width: 620px) {
    .outer-pad { padding: 20px 10px !important; }
    .sec-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .head-pad { padding: 28px 20px 22px !important; }
    .block-pad-sm { padding-top: 20px !important; padding-bottom: 0 !important; }
    .block-pad-md { padding-top: 24px !important; padding-bottom: 24px !important; }
    .block-pad-lg { padding-top: 32px !important; }
    .block-pad-footer { padding: 20px 20px 32px !important; }
    .hero-title { font-size: 30px !important; line-height: 1.15 !important; }
    .hero-amount { font-size: 34px !important; line-height: 1.05 !important; }
    .stat-amount { font-size: 26px !important; line-height: 1.1 !important; }
    .stat-amount-md { font-size: 22px !important; }
    .quote-text { font-size: 16px !important; line-height: 1.55 !important; padding-left: 14px !important; }
    .body-text { font-size: 14px !important; line-height: 1.65 !important; }
    .col-stack,
    .col-third {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
    .col-third { padding: 0 0 12px 0 !important; }
    .col-third-last { padding-bottom: 0 !important; }
    .col-half-stack {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      text-align: left !important;
      padding-top: 14px !important;
    }
    .align-right-mobile { text-align: left !important; }
    .footer-col {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      text-align: center !important;
      padding: 5px 0 !important;
    }
    .expenses-scroll {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch;
    }
    .expenses-scroll table { min-width: 260px; }
    .expenses-table .amount-cell { font-size: 12px !important; }
    .expenses-table td:first-child { font-size: 12px !important; padding-right: 10px !important; }
    .kpi-row .kpi-cell {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      border-right: none !important;
      box-sizing: border-box !important;
    }
    .kpi-row .kpi-cell:not(:last-child) { border-bottom: 1px solid #cbd5e1 !important; }
    .nav-pad { padding: 18px 20px !important; }
    .nav-meta {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      text-align: left !important;
      padding-top: 14px !important;
    }
    .nav-brand-inner tr { display: block !important; width: 100% !important; }
    .nav-brand-inner td {
      display: block !important;
      width: 100% !important;
      border-right: none !important;
      padding: 0 0 8px 0 !important;
    }
    .shell-radius { border-radius: 16px !important; }
    .aurora-hero-pad { padding: 28px 20px 36px !important; }
    .aurora-hero-title { font-size: 26px !important; }
    .aurora-card-num { font-size: 24px !important; }
    .itemized-head-pad { padding: 22px 20px 18px !important; }
    .itemized-title { font-size: 24px !important; }
  }
  @media screen and (min-width: 621px) and (max-width: 768px) {
    .sec-pad { padding-left: 28px !important; padding-right: 28px !important; }
    .head-pad { padding: 36px 32px 28px !important; }
    .hero-amount { font-size: 42px !important; }
    .outer-pad { padding: 32px 16px !important; }
    .col-third { padding-left: 5px !important; padding-right: 5px !important; }
  }
</style>`

function addClassToStyle(html, styleFragment, className) {
  const needle = `style="${styleFragment}"`
  const replacement = `class="${className}" style="${styleFragment}"`
  if (!html.includes(needle)) {
    throw new Error(`Style fragment not found: ${styleFragment.slice(0, 40)}…`)
  }
  return html.replace(needle, replacement)
}

function injectStyles(html) {
  if (html.includes('@media screen and (max-width: 620px)')) {
    return html
  }
  return html.replace(/<title>[^<]*<\/title>/, (match) => `${match}\n${RESPONSIVE_STYLES}`)
}

function wrapExpensesList(html) {
  return html
    .replace(
      '<div style="font-size:14px;line-height:1.8;color:#27272a;">{{ expensesList }}</div>',
      '<div class="expenses-scroll" style="width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;"><div style="font-size:14px;line-height:1.8;color:#27272a;min-width:260px;">{{ expensesList }}</div></div>',
    )
    .replace(
      '<td style="padding:24px 28px;font-size:14px;line-height:1.8;color:#1e293b;">{{ expensesList }}</td>',
      '<td class="expenses-scroll" style="padding:20px 16px;font-size:14px;line-height:1.8;color:#1e293b;">{{ expensesList }}</td>',
    )
    .replace(
      '<div style="font-size:14px;line-height:1.8;color:#1e293b;">{{ expensesList }}</div>',
      '<div class="expenses-scroll" style="width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;"><div style="font-size:14px;line-height:1.8;color:#1e293b;min-width:260px;">{{ expensesList }}</div></div>',
    )
    .replace(
      '<td style="padding:20px 22px;font-size:13px;line-height:1.5;color:#14532d;">{{ expensesList }}</td>',
      '<td class="expenses-scroll" style="padding:16px 14px;font-size:13px;line-height:1.5;color:#14532d;">{{ expensesList }}</td>',
    )
}

const patches = {
  'predefined-editorial': (html) => {
    let h = html
    h = addClassToStyle(h, 'padding:56px 16px;', 'outer-pad')
    h = addClassToStyle(h, 'padding:48px 48px 32px;', 'head-pad sec-pad')
    h = h.replace(
      '<h1 style="margin:14px 0 0;font-family:Georgia,\'Times New Roman\',serif;font-size:42px;line-height:1.1;font-weight:400;color:#18181b;letter-spacing:-0.5px;">',
      '<h1 class="hero-title" style="margin:14px 0 0;font-family:Georgia,\'Times New Roman\',serif;font-size:42px;line-height:1.1;font-weight:400;color:#18181b;letter-spacing:-0.5px;">',
    )
    h = h.replace(
      '<td align="right" valign="top" style="padding-top:6px;">',
      '<td align="right" valign="top" class="col-half-stack align-right-mobile" style="padding-top:6px;">',
    )
    h = addClassToStyle(h, 'padding:0 48px 8px;', 'sec-pad')
    h = addClassToStyle(h, 'padding:24px 48px 8px;', 'sec-pad block-pad-sm body-text')
    h = h.replace(
      '<p style="margin:0;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Wypłata</p>\n              <p class="hero-amount num"',
      '<p style="margin:0;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Wypłata</p>\n              <p class="hero-amount num"',
    )
    h = h.replace(
      '<td style="padding:32px 48px 0;">\n              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Wypłata</p>',
      '<td class="sec-pad block-pad-sm" style="padding:32px 48px 0;">\n              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Wypłata</p>',
    )
    h = h.replace(
      '<td style="padding:24px 48px 0;">\n              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Łączne wydatki</p>',
      '<td class="sec-pad block-pad-sm" style="padding:24px 48px 0;">\n              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Łączne wydatki</p>',
    )
    h = h.replace(
      '<p style="margin:10px 0 0;font-family:Georgia,\'Times New Roman\',serif;font-size:38px;line-height:1;font-weight:400;color:#15803d;letter-spacing:-1px;">{{ salaryAmount }}</p>',
      '<p class="hero-amount num" style="margin:10px 0 0;font-family:Georgia,\'Times New Roman\',serif;font-size:38px;line-height:1;font-weight:400;color:#15803d;letter-spacing:-1px;">{{ salaryAmount }}</p>',
    )
    h = h.replace(
      '<p style="margin:10px 0 0;font-family:Georgia,\'Times New Roman\',serif;font-size:54px;line-height:1;font-weight:400;color:#18181b;letter-spacing:-1px;">{{ totalExpenses }}</p>',
      '<p class="hero-amount num" style="margin:10px 0 0;font-family:Georgia,\'Times New Roman\',serif;font-size:54px;line-height:1;font-weight:400;color:#18181b;letter-spacing:-1px;">{{ totalExpenses }}</p>',
    )
    h = addClassToStyle(h, 'padding:32px 48px;', 'sec-pad block-pad-md')
    h = addClassToStyle(h, 'padding:0 48px;', 'sec-pad')
    h = h.replace(
      '<p style="margin:8px 0 0;font-family:Georgia,\'Times New Roman\',serif;font-size:30px;line-height:1.1;font-weight:400;color:#18181b;">{{ savingsAmount }}</p>',
      '<p class="stat-amount num" style="margin:8px 0 0;font-family:Georgia,\'Times New Roman\',serif;font-size:30px;line-height:1.1;font-weight:400;color:#18181b;">{{ savingsAmount }}</p>',
    )
    h = h.replace(
      '<td valign="top" align="right">',
      '<td valign="top" align="right" class="col-half-stack align-right-mobile">',
    )
    h = h.replace(
      '<p style="margin:0;font-family:Georgia,\'Times New Roman\',serif;font-size:18px;font-style:italic;line-height:1.6;color:#3f3f46;border-left:2px solid #a16207;padding-left:20px;">{{ savingsMessage }}</p>',
      '<p class="quote-text" style="margin:0;font-family:Georgia,\'Times New Roman\',serif;font-size:18px;font-style:italic;line-height:1.6;color:#3f3f46;border-left:2px solid #a16207;padding-left:20px;">{{ savingsMessage }}</p>',
    )
    h = h.replace(
      '<td style="padding:48px 48px 0;">\n              <p style="margin:0 0 16px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Aktywność szczegółowa</p>',
      '<td class="sec-pad block-pad-lg" style="padding:48px 48px 0;">\n              <p style="margin:0 0 16px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Aktywność szczegółowa</p>',
    )
    h = h.replace(
      '<td style="padding:48px 48px 0;">\n              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">\n                <tr><td style="height:1px;background-color:#ececec',
      '<td class="sec-pad" style="padding:48px 48px 0;">\n              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">\n                <tr><td style="height:1px;background-color:#ececec',
    )
    h = addClassToStyle(h, 'padding:24px 48px 48px;', 'sec-pad block-pad-footer')
    h = h.replace('<td align="right">', '<td align="right" class="footer-col">')
    h = h.replace('Saldo / oszczędności', 'Pozostało')
    return h
  },

  'predefined-aurora': (html) => {
    let h = html
    h = addClassToStyle(h, 'padding:32px 16px;', 'outer-pad')
    h = h.replace(
      '<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background-color:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(99,102,241,0.18);">',
      '<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" class="shell-radius" style="max-width:640px;width:100%;background-color:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(99,102,241,0.18);">',
    )
    h = addClassToStyle(h, 'padding:48px 40px 56px;color:#ffffff;', 'aurora-hero-pad')
    h = h.replace(
      '<h1 style="margin:20px 0 0;font-size:36px;line-height:1.15;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">',
      '<h1 class="aurora-hero-title" style="margin:20px 0 0;font-size:36px;line-height:1.15;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">',
    )
    h = addClassToStyle(h, 'padding:32px 32px 0;', 'sec-pad block-pad-sm')
    h = h.replace(
      '<td width="33%" valign="top" style="padding:0 6px 0 0;">',
      '<td width="33%" valign="top" class="col-third col-stack" style="padding:0 6px 0 0;">',
    )
    h = h.replace(
      '<td width="33%" valign="top" style="padding:0 6px;">',
      '<td width="33%" valign="top" class="col-third col-stack" style="padding:0 6px;">',
    )
    h = h.replace(
      '<td width="34%" valign="top" style="padding:0 0 0 6px;">',
      '<td width="34%" valign="top" class="col-third col-third-last col-stack" style="padding:0 0 0 6px;">',
    )
    h = h.replace(
      '<p style="margin:14px 0 0;font-size:28px;font-weight:800;color:#312e81;line-height:1;letter-spacing:-0.5px;">{{ salaryAmount }}</p>',
      '<p class="aurora-card-num num" style="margin:14px 0 0;font-size:28px;font-weight:800;color:#312e81;line-height:1;letter-spacing:-0.5px;">{{ salaryAmount }}</p>',
    )
    h = h.replace(
      '<p style="margin:14px 0 0;font-size:32px;font-weight:800;color:#831843;line-height:1;letter-spacing:-0.5px;">{{ totalExpenses }}</p>',
      '<p class="aurora-card-num num" style="margin:14px 0 0;font-size:32px;font-weight:800;color:#831843;line-height:1;letter-spacing:-0.5px;">{{ totalExpenses }}</p>',
    )
    h = h.replace(
      '<p style="margin:14px 0 0;font-size:32px;font-weight:800;color:#064e3b;line-height:1;letter-spacing:-0.5px;">{{ savingsAmount }}</p>',
      '<p class="aurora-card-num num" style="margin:14px 0 0;font-size:32px;font-weight:800;color:#064e3b;line-height:1;letter-spacing:-0.5px;">{{ savingsAmount }}</p>',
    )
    h = h.replace(/style="padding:24px 32px 0;"/g, 'class="sec-pad block-pad-sm" style="padding:24px 32px 0;"')
    h = addClassToStyle(h, 'padding:32px 32px 40px;', 'sec-pad block-pad-footer')
    return h
  },

  'predefined-ledger': (html) => {
    let h = html
    h = addClassToStyle(h, 'padding:40px 16px;', 'outer-pad')
    h = addClassToStyle(h, 'background-color:#0c1729;padding:24px 36px;', 'nav-pad')
    h = h.replace(
      '<td align="right" valign="middle">',
      '<td align="right" valign="middle" class="nav-meta">',
    )
    h = h.replace(
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0">\n                      <tr>\n                        <td style="padding-right:14px;border-right:2px solid #1e40af;">',
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="nav-brand-inner">\n                      <tr>\n                        <td style="padding-right:14px;border-right:2px solid #1e40af;">',
    )
    h = addClassToStyle(h, 'padding:36px 36px 8px;', 'sec-pad body-text')
    h = h.replace(
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #cbd5e1;">',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="kpi-row" style="border-collapse:collapse;border:1px solid #cbd5e1;">',
    )
    h = h.replace(
      '<td width="33%" style="padding:18px 22px;background-color:#f8fafc;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;">\n                    <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#64748b;">Wypłata</p>',
      '<td width="33%" class="kpi-cell col-stack" style="padding:18px 22px;background-color:#f8fafc;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;">\n                    <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#64748b;">Wypłata</p>',
    )
    h = h.replace(
      '<td width="34%" style="padding:18px 22px;background-color:#f8fafc;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;">\n                    <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#64748b;">Łączne wydatki</p>',
      '<td width="34%" class="kpi-cell col-stack" style="padding:18px 22px;background-color:#f8fafc;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;">\n                    <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#64748b;">Łączne wydatki</p>',
    )
    h = h.replace(
      '<td width="33%" style="padding:18px 22px;background-color:#f8fafc;border-bottom:1px solid #cbd5e1;">\n                    <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#64748b;">Pozostało</p>',
      '<td width="33%" class="kpi-cell kpi-cell-last col-stack" style="padding:18px 22px;background-color:#f8fafc;border-bottom:1px solid #cbd5e1;">\n                    <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#64748b;">Pozostało</p>',
    )
    h = h.replace(
      '<p style="margin:8px 0 0;font-size:24px;font-weight:700;color:#15803d;letter-spacing:-0.3px;">{{ salaryAmount }}</p>',
      '<p class="stat-amount-md num" style="margin:8px 0 0;font-size:24px;font-weight:700;color:#15803d;letter-spacing:-0.3px;">{{ salaryAmount }}</p>',
    )
    h = h.replace(
      '<p style="margin:8px 0 0;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">{{ totalExpenses }}</p>',
      '<p class="stat-amount-md num" style="margin:8px 0 0;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">{{ totalExpenses }}</p>',
    )
    h = h.replace(
      '<p style="margin:8px 0 0;font-size:24px;font-weight:700;color:#1e40af;letter-spacing:-0.3px;">{{ savingsAmount }}</p>',
      '<p class="stat-amount-md num" style="margin:8px 0 0;font-size:24px;font-weight:700;color:#1e40af;letter-spacing:-0.3px;">{{ savingsAmount }}</p>',
    )
    h = h.replace(
      '<td colspan="2" style="padding:18px 22px;background-color:#ffffff;">',
      '<td colspan="3" class="kpi-cell" style="padding:18px 22px;background-color:#ffffff;">',
    )
    h = h.replace(/style="padding:28px 36px 0;"/g, 'class="sec-pad block-pad-sm" style="padding:28px 36px 0;"')
    h = addClassToStyle(h, 'padding:36px 36px 0;', 'sec-pad block-pad-lg')
    h = addClassToStyle(h, 'padding:32px 36px 28px;', 'sec-pad')
    h = addClassToStyle(h, 'padding:0 36px 32px;background-color:#ffffff;', 'sec-pad block-pad-footer')
    h = h.replace(
      '<td align="right">\n                    <p style="margin:0;font-size:11px;letter-spacing:1px;color:#94a3b8;">Confidential',
      '<td align="right" class="footer-col align-right-mobile">\n                    <p style="margin:0;font-size:11px;letter-spacing:1px;color:#94a3b8;">Confidential',
    )
    return h
  },

  'predefined-itemized': (html) => {
    let h = html
    h = addClassToStyle(h, 'padding:36px 16px;', 'outer-pad')
    h = addClassToStyle(h, 'padding:28px 32px 20px;background-color:#14532d;color:#ecfdf5;', 'itemized-head-pad')
    h = h.replace(
      '<h1 style="margin:12px 0 0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">',
      '<h1 class="itemized-title" style="margin:12px 0 0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">',
    )
    h = h.replace(
      '<td align="right" valign="top">',
      '<td align="right" valign="top" class="col-half-stack align-right-mobile">',
    )
    h = h.replace(
      '<td style="padding:24px 32px 0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;">',
      '<td class="sec-pad block-pad-sm body-text" style="padding:24px 32px 0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;">',
    )
    h = h.replace(/style="padding:20px 32px 0;"/g, 'class="sec-pad block-pad-sm" style="padding:20px 32px 0;"')
    h = h.replace(
      '<td width="33%" valign="top" style="padding:0 4px 0 0;">',
      '<td width="33%" valign="top" class="col-third col-stack" style="padding:0 4px 0 0;">',
    )
    h = h.replace(
      '<td width="34%" valign="top" style="padding:0 4px;">',
      '<td width="34%" valign="top" class="col-third col-stack" style="padding:0 4px;">',
    )
    h = h.replace(
      '<td width="33%" valign="top" style="padding:0 0 0 4px;">',
      '<td width="33%" valign="top" class="col-third col-third-last col-stack" style="padding:0 0 0 4px;">',
    )
    h = h.replace(
      '<p style="margin:8px 0 0;font-size:22px;font-weight:800;color:#14532d;letter-spacing:-0.5px;">{{ salaryAmount }}</p>',
      '<p class="stat-amount num" style="margin:8px 0 0;font-size:22px;font-weight:800;color:#14532d;letter-spacing:-0.5px;">{{ salaryAmount }}</p>',
    )
    h = h.replace(
      '<p style="margin:8px 0 0;font-size:26px;font-weight:800;color:#14532d;letter-spacing:-0.5px;">{{ totalExpenses }}</p>',
      '<p class="stat-amount num" style="margin:8px 0 0;font-size:26px;font-weight:800;color:#14532d;letter-spacing:-0.5px;">{{ totalExpenses }}</p>',
    )
    h = h.replace(
      '<p style="margin:8px 0 0;font-size:26px;font-weight:800;color:#14532d;letter-spacing:-0.5px;">{{ savingsAmount }}</p>',
      '<p class="stat-amount num" style="margin:8px 0 0;font-size:26px;font-weight:800;color:#14532d;letter-spacing:-0.5px;">{{ savingsAmount }}</p>',
    )
    h = addClassToStyle(h, 'padding:28px 32px 8px;', 'sec-pad')
    h = h.replace(
      '<td style="padding:0 32px 28px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;">',
      '<td class="sec-pad block-pad-footer" style="padding:0 32px 28px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;">',
    )
    return h
  },
}

const templates = JSON.parse(readFileSync(jsonPath, 'utf8'))

for (const template of templates) {
  const patch = patches[template.id]
  let content = patch(template.content)
  content = injectStyles(content)
  content = wrapExpensesList(content)
  template.content = content
}

writeFileSync(jsonPath, `${JSON.stringify(templates, null, 2)}\n`)
console.log('Updated', templates.length, 'templates')
