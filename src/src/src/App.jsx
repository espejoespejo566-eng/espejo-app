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
