import React, { useState, useMemo, useEffect } from "react";
import { computeModel, fmtMoney, fmtPct, fmtNum, statusOf } from "./engine.js";

const FREE_PROJECTS = 1;
const PRICE_LABEL = "$450 MXN";
const ADMIN_CODE = "espejo566"; // ?admin=espejo566 en la URL = acceso ilimitado para ti

function useAccess() {
  const [used, setUsed] = useState(() =>
    Number(localStorage.getItem("espejo_used") || 0)
  );
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === ADMIN_CODE) {
      localStorage.setItem("espejo_admin", "1");
    }
    if (localStorage.getItem("espejo_admin") === "1") {
      setIsAdmin(true);
    }
  }, []);

  const registerUse = () => {
    const next = used + 1;
    setUsed(next);
    localStorage.setItem("espejo_used", String(next));
  };

  const hasAccess = isAdmin || used < FREE_PROJECTS;
  return { used, isAdmin, hasAccess, registerUse };
}

function StatusDot({ statusKey }) {
  const colorMap = {
    good: "var(--green)",
    warn: "var(--amber)",
    bad: "var(--red)",
    neutral: "var(--muted)",
  };
  const labelMap = { good: "Sano", warn: "Vigilar", bad: "Riesgo", neutral: "—" };
  if (!statusKey) return null;
  return (
    <div className="kpi-dot-wrap">
      <span className="kpi-dot" style={{ background: colorMap[statusKey] }} />
      <span className="kpi-dot-label">{labelMap[statusKey]}</span>
    </div>
  );
}

function KpiCard({ label, value, sub, statusKey }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <span />
        <StatusDot statusKey={statusKey} />
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function MarginBar({ label, value }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const color =
    value >= 0.25 ? "var(--green)" : value >= 0.1 ? "var(--amber)" : "var(--red)";
  return (
    <div>
      <div className="margin-row-top">
        <span>{label}</span>
        <span className="mono">{fmtPct(value)}</span>
      </div>
      <div className="margin-track">
        <div className="margin-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function InputField({ label, unit, value, onChange, step = 1, min = 0 }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <div className="field-inputwrap">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {unit && <span className="field-unit">{unit}</span>}
      </div>
    </label>
  );
}

function Landing({ onStart }) {
  return (
    <div className="landing">
      <div className="landing-inner">
        <div className="brand">
          <div className="brand-mark">
            ESP<span>EJO</span>
          </div>
        </div>
        <h1>La herramienta que convierte proyectos reales en capital</h1>
        <p className="landing-sub">
          Construye tu proyecto de inversión desde cero — VAN, TIR, DSCR, márgenes
          y dashboard ejecutivo, con cifras defendibles ante un banco. Sin ser
          financiero.
        </p>
        <button className="cta-btn" onClick={onStart}>
          Construir mi proyecto — 1ra sesión gratis
        </button>
        <div className="landing-price-note">
          Después: {PRICE_LABEL} por proyecto · pago único · sin suscripción
        </div>

        <div className="landing-features">
          <div className="feature">
            <div className="feature-title">Indicadores bancarios</div>
            <div className="feature-desc">
              VAN, TIR, Payback, DSCR, ROI, ROE, ROA y punto de equilibrio,
              calculados con fórmulas reales.
            </div>
          </div>
          <div className="feature">
            <div className="feature-title">Seis márgenes</div>
            <div className="feature-desc">
              Bruto, contribución, EBITDA, operativo, neto y seguridad — el mismo
              estándar que exige un comité de crédito.
            </div>
          </div>
          <div className="feature">
            <div className="feature-title">Semáforo de riesgo</div>
            <div className="feature-desc">
              Cada indicador clave se marca en verde, amarillo o rojo según qué
              tan defendible es frente a un banco.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Paywall({ used }) {
  return (
    <div className="paywall">
      <div className="paywall-card">
        <div className="brand-mark small">
          ESP<span>EJO</span>
        </div>
        <h2>Ya usaste tu sesión gratuita</h2>
        <p>
          Construiste {used} proyecto{used === 1 ? "" : "s"} con ESPEJO. Para
          seguir generando modelos financieros bancables, activa el acceso de
          pago.
        </p>
        <div className="paywall-price">{PRICE_LABEL}</div>
        <div className="paywall-price-sub">por proyecto · pago único</div>
        <button
          className="cta-btn"
          onClick={() =>
            alert(
              "Aquí se conecta tu procesador de pagos real (Stripe, Mercado Pago o Conekta). Este botón es el gancho de la interfaz — falta la integración con la pasarela."
            )
          }
        >
          Comprar acceso — {PRICE_LABEL}
        </button>
        <div className="paywall-note">
          ¿Eres tú, Espejo? Entra con <code>?admin=espejo566</code> al final del
          link para acceso ilimitado sin costo.
        </div>
      </div>
    </div>
  );
}

function Calculator({ onUsed }) {
  const [inputs, setInputs] = useState({
    projectName: "Proyecto de Inversión",
    capex: 5000000,
    rev1: 3200000,
    growth: 6,
    varCostPct: 55,
    fixedCosts1: 900000,
    inflation: 4,
    horizon: 8,
    wacc: 15,
    debtPct: 60,
    interestRate: 13.5,
    taxRate: 30,
  });
  const [counted, setCounted] = useState(false);

  const set = (key) => (val) => setInputs((p) => ({ ...p, [key]: val }));
  const model = useMemo(() => computeModel(inputs), [inputs]);

  useEffect(() => {
    if (!counted) {
      onUsed();
      setCounted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxVal = Math.max(
    ...model.rows.map((r) => Math.max(r.revenue, r.ebitda, Math.abs(r.netIncome))),
    1
  );

  return (
    <div className="shell">
      <div className="header">
        <div className="brand">
          <div className="brand-mark">
            ESP<span>EJO</span>
          </div>
          <div className="brand-tag">Constructor de proyectos de inversión bancables</div>
        </div>
        <div className="header-right">Cifras calculadas en vivo · FIRA / Banorte / NAFIN ready</div>
      </div>

      <div className="grid">
        <div className="panel">
          <div className="panel-title">Datos del proyecto</div>
          <label className="field name-field">
            <span className="field-label">Nombre</span>
            <div className="field-inputwrap">
              <input
                type="text"
                value={inputs.projectName}
                onChange={(e) => setInputs((p) => ({ ...p, projectName: e.target.value }))}
              />
            </div>
          </label>
          <InputField label="Inversión inicial (CAPEX)" unit="MXN" value={inputs.capex} step={50000} onChange={set("capex")} />
          <InputField label="Horizonte de evaluación" unit="años" value={inputs.horizon} step={1} min={1} onChange={set("horizon")} />

          <div className="panel-title">Financiamiento</div>
          <InputField label="% Financiado con deuda" unit="%" value={inputs.debtPct} onChange={set("debtPct")} />
          <InputField label="Tasa de interés anual" unit="%" value={inputs.interestRate} step={0.1} onChange={set("interestRate")} />
          <InputField label="WACC / tasa de descuento" unit="%" value={inputs.wacc} step={0.5} onChange={set("wacc")} />

          <div className="panel-title">Ingresos y costos</div>
          <InputField label="Ingresos año 1" unit="MXN" value={inputs.rev1} step={50000} onChange={set("rev1")} />
          <InputField label="Crecimiento anual de ingresos" unit="%" value={inputs.growth} step={0.5} onChange={set("growth")} />
          <InputField label="Costos variables (% de ingresos)" unit="%" value={inputs.varCostPct} onChange={set("varCostPct")} />
          <InputField label="Costos fijos año 1" unit="MXN" value={inputs.fixedCosts1} step={25000} onChange={set("fixedCosts1")} />
          <InputField label="Inflación anual de costos" unit="%" value={inputs.inflation} step={0.5} onChange={set("inflation")} />
          <InputField label="ISR" unit="%" value={inputs.taxRate} onChange={set("taxRate")} />

          <div className="legend-note">
            <span><span className="legend-swatch" style={{ background: "var(--blue)" }} />Editable</span>
            <span><span className="legend-swatch" style={{ background: "var(--green)" }} />Calculado</span>
          </div>
        </div>

        <div>
          <div className="kpi-row">
            <KpiCard label="VAN" value={fmtMoney(model.van)} sub={`WACC ${fmtNum(inputs.wacc)}%`} statusKey={statusOf("van", model.van, inputs)} />
            <KpiCard label="TIR" value={model.tir !== null ? fmtPct(model.tir) : "—"} sub="vs. WACC del proyecto" statusKey={statusOf("tir", model.tir, inputs)} />
            <KpiCard label="Payback" value={model.payback !== null ? `${fmtNum(model.payback)} años` : "—"} sub="Recuperación de capital" statusKey={statusOf("payback", model.payback, inputs)} />
            <KpiCard label="DSCR promedio" value={fmtNum(model.avgDscr, 2)} sub="Cobertura de deuda" statusKey={statusOf("dscr", model.avgDscr, inputs)} />
          </div>

          <div className="kpi-row">
            <KpiCard label="ROI" value={fmtPct(model.roi)} />
            <KpiCard label="ROE" value={fmtPct(model.roe)} />
            <KpiCard label="ROA" value={fmtPct(model.roa)} />
            <KpiCard label="Punto de equilibrio (año 1)" value={fmtMoney(model.breakevenY1)} />
          </div>

          <div className="chart-panel">
            <div className="chart-title">Proyección financiera</div>
            <div className="chart-legend">
              <span><span className="legend-swatch" style={{ background: "var(--blue)" }} />Ingresos</span>
              <span><span className="legend-swatch" style={{ background: "var(--gold)" }} />EBITDA</span>
              <span><span className="legend-swatch" style={{ background: "var(--green)" }} />Utilidad neta</span>
            </div>
            <div className="barchart">
              {model.rows.map((r) => (
                <div className="barchart-col" key={r.year}>
                  <div className="barchart-bars">
                    <div className="barchart-bar" style={{ height: Math.max(2, (r.revenue / maxVal) * 170), background: "var(--blue)" }} title={`Ingresos: ${fmtMoney(r.revenue)}`} />
                    <div className="barchart-bar" style={{ height: Math.max(2, (r.ebitda / maxVal) * 170), background: "var(--gold)" }} title={`EBITDA: ${fmtMoney(r.ebitda)}`} />
                    <div className="barchart-bar" style={{ height: Math.max(2, (Math.abs(r.netIncome) / maxVal) * 170), background: "var(--green)" }} title={`Utilidad neta: ${fmtMoney(r.netIncome)}`} />
                  </div>
                  <div className="barchart-yearlabel">Año {r.year}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="secondary-grid">
            <div className="chart-panel" style={{ marginBottom: 0 }}>
              <div className="chart-title">Márgenes (año 1)</div>
              <div className="margins-list">
                <MarginBar label="Margen bruto" value={model.margenBruto} />
                <MarginBar label="Margen de contribución" value={model.margenContribucion} />
                <MarginBar label="Margen EBITDA" value={model.margenEbitda} />
                <MarginBar label="Margen operativo" value={model.margenOperativo} />
                <MarginBar label="Margen neto" value={model.margenNeto} />
                <MarginBar label="Margen de seguridad" value={model.margenSeguridad} />
              </div>
            </div>
            <div className="chart-panel" style={{ marginBottom: 0 }}>
              <div className="chart-title">Estructura de capital</div>
              <div className="mini-stats">
                <div className="mini-stat"><div className="mini-stat-label">Capital propio</div><div className="mini-stat-value">{fmtMoney(model.equity)}</div></div>
                <div className="mini-stat"><div className="mini-stat-label">Deuda</div><div className="mini-stat-value">{fmtMoney(model.debtAmount)}</div></div>
                <div className="mini-stat"><div className="mini-stat-label">CAPEX total</div><div className="mini-stat-value">{fmtMoney(inputs.capex)}</div></div>
                <div className="mini-stat"><div className="mini-stat-label">Horizonte</div><div className="mini-stat-value">{inputs.horizon} años</div></div>
              </div>
            </div>
          </div>

          <div className="footer-cta">
            Este panel es el motor de cálculo de ESPEJO: cada indicador se genera
            con fórmulas encadenadas desde los supuestos — sin cifras fijas —
            igual que un modelo bancario defendible.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { used, isAdmin, hasAccess, registerUse } = useAccess();
  const [started, setStarted] = useState(false);

  if (!started) {
    return <Landing onStart={() => setStarted(true)} />;
  }

  if (!hasAccess) {
    return <Paywall used={used} />;
  }

  return <Calculator onUsed={registerUse} />;
}
