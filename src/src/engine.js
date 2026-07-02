export function npv(rate, flows) {
  return flows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
}

export function irr(flows) {
  let lo = -0.99,
    hi = 5;
  let fLo = npv(lo, flows),
    fHi = npv(hi, flows);
  if (fLo * fHi > 0) {
    for (let r = -0.9; r <= 5; r += 0.01) {
      const f1 = npv(r, flows);
      const f2 = npv(r + 0.01, flows);
      if (f1 * f2 <= 0) {
        lo = r;
        hi = r + 0.01;
        break;
      }
    }
  }
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, flows);
    if (Math.abs(fMid) < 1e-6) return mid;
    if (npv(lo, flows) * fMid < 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export function computeModel(inp) {
  const {
    capex,
    rev1,
    growth,
    varCostPct,
    fixedCosts1,
    inflation,
    horizon,
    wacc,
    debtPct,
    interestRate,
    taxRate,
  } = inp;

  const debtAmount = capex * (debtPct / 100);
  const equity = capex - debtAmount;
  const principalPayment = debtAmount / horizon;
  const depreciation = capex / horizon;

  let balance = debtAmount;
  const rows = [];

  for (let t = 1; t <= horizon; t++) {
    const revenue = rev1 * Math.pow(1 + growth / 100, t - 1);
    const varCosts = revenue * (varCostPct / 100);
    const grossMargin = revenue - varCosts;
    const fixedCostsT = fixedCosts1 * Math.pow(1 + inflation / 100, t - 1);
    const ebitda = grossMargin - fixedCostsT;
    const ebit = ebitda - depreciation;
    const interest = balance * (interestRate / 100);
    const ebt = ebit - interest;
    const taxes = Math.max(ebt, 0) * (taxRate / 100);
    const netIncome = ebt - taxes;
    const fcfe = netIncome + depreciation - principalPayment;
    const debtService = interest + principalPayment;
    const dscr = debtService > 0 ? ebitda / debtService : null;
    const breakeven = fixedCostsT / (1 - varCostPct / 100);

    rows.push({
      year: t,
      revenue,
      varCosts,
      grossMargin,
      fixedCosts: fixedCostsT,
      ebitda,
      depreciation,
      ebit,
      interest,
      ebt,
      taxes,
      netIncome,
      fcfe,
      debtService,
      dscr,
      breakeven,
      balance,
    });

    balance = Math.max(0, balance - principalPayment);
  }

  const flows = [-equity, ...rows.map((r) => r.fcfe)];
  const van = npv(wacc / 100, flows);
  const tir = irr(flows);

  let cum = -equity;
  let payback = null;
  for (let i = 0; i < rows.length; i++) {
    const prevCum = cum;
    cum += rows[i].fcfe;
    if (cum >= 0 && payback === null) {
      const frac = -prevCum / rows[i].fcfe;
      payback = rows[i].year - 1 + frac;
    }
  }

  const sumFcfe = rows.reduce((a, r) => a + r.fcfe, 0);
  const roi = equity > 0 ? (sumFcfe - equity) / equity : null;
  const avgNetIncome = rows.reduce((a, r) => a + r.netIncome, 0) / rows.length;
  const roe = equity > 0 ? avgNetIncome / equity : null;
  const roa = capex > 0 ? avgNetIncome / capex : null;

  const y1 = rows[0];
  const margenBruto = y1.grossMargin / y1.revenue;
  const margenContribucion = margenBruto;
  const margenEbitda = y1.ebitda / y1.revenue;
  const margenOperativo = y1.ebit / y1.revenue;
  const margenNeto = y1.netIncome / y1.revenue;
  const margenSeguridad = (y1.revenue - y1.breakeven) / y1.revenue;

  const dscrRows = rows.filter((r) => r.dscr !== null);
  const avgDscr =
    dscrRows.reduce((a, r) => a + r.dscr, 0) / Math.max(1, dscrRows.length);

  return {
    rows,
    equity,
    debtAmount,
    van,
    tir,
    payback,
    roi,
    roe,
    roa,
    margenBruto,
    margenContribucion,
    margenEbitda,
    margenOperativo,
    margenNeto,
    margenSeguridad,
    avgDscr,
    breakevenY1: y1.breakeven,
  };
}

export const fmtMoney = (v) =>
  v === null || v === undefined || Number.isNaN(v)
    ? "—"
    : new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
      }).format(v);

export const fmtPct = (v) =>
  v === null || v === undefined || Number.isNaN(v)
    ? "—"
    : `${(v * 100).toFixed(1)}%`;

export const fmtNum = (v, d = 1) =>
  v === null || v === undefined || Number.isNaN(v) ? "—" : v.toFixed(d);

export function statusOf(kind, value, ctx) {
  if (value === null || value === undefined || Number.isNaN(value))
    return "neutral";
  if (kind === "van") return value > 0 ? "good" : "bad";
  if (kind === "tir") {
    if (value * 100 >= ctx.wacc + 5) return "good";
    if (value * 100 >= ctx.wacc) return "warn";
    return "bad";
  }
  if (kind === "dscr") {
    if (value >= 1.25) return "good";
    if (value >= 1.0) return "warn";
    return "bad";
  }
  if (kind === "payback") {
    if (value <= 5) return "good";
    if (value <= 8) return "warn";
    return "bad";
  }
  return "neutral";
}
