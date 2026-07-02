# ESPEJO — App financiera con cobro por proyecto

App real (React + Vite) para que emprendedores construyan su proyecto de
inversión — VAN, TIR, DSCR, márgenes, dashboard — y tú cobres por cada uno.

## Cómo funciona el negocio ya montado

- Primera sesión: **gratis**, para que el cliente pruebe.
- Después: pantalla de pago (`$450 MXN` por proyecto — cámbialo en
  `src/App.jsx`, constante `PRICE_LABEL`).
- Tú, como dueño, entras a la URL agregando `?admin=espejo566` una sola vez
  y quedas con acceso ilimitado sin pagar.

## Lo que falta conectar

El botón "Comprar acceso" todavía no cobra dinero real — falta conectar
Conekta, Mercado Pago o Stripe con las llaves API de la cuenta.

## Cómo correrlo en tu compu

```
npm install
npm run dev
```
