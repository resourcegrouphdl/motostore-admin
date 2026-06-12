# MotoStore Admin — PRODUCT.md

## Product

**Name:** MotoStore Admin  
**Type:** SaaS back-office dashboard for moto dealers in Peru  
**Register:** product (design serves the tool; clarity and speed over expression)

## Users

Primary users are sales reps, cashiers, and store managers at moto dealerships. They work on desktops and laptops in the dealership, under natural light, often while talking to customers. Speed and accuracy matter more than aesthetics — but they take pride in using a professional-looking tool.

Secondary users are tenant admins configuring the store (catalog, users, roles).

## Purpose

MotoStore Admin centralizes:
- Sales (sales list, delivery form, quote wizard)
- Inventory (moto catalog, stock tracking)
- Credit & Collection (loan applications, installment schedules, overdue accounts, payments)
- WhatsApp (real-time conversation panel)
- Analytics (KPIs, sales, inventory, credit, customer reports)

The admin enables a small team (3–10 people) to run a full dealership without paper or spreadsheets.

## Brand personality

**Professional and reliable.** Serious tool for real businesses. Clarity before delight. No surprises, no inconsistencies. Trustworthy data presentation.

## Color strategy

**Restrained.** Tinted neutrals + one accent (≤10%). Light theme only. Background is neutral (not warm-cream), surface is white or very slightly tinted. Accent is a single brand color applied to active states, CTAs, and key data points.

No dark mode — the team works under ambient natural light; a forced dark interface creates unnecessary friction.

## Anti-references

- **Not Salesforce/SAP:** No dense blue corporate UI, no ERP-feel, no overwhelming tables without breathing room.  
- **Not Notion-style:** No oversized editorial whitespace, no blank minimalism that lacks information density.  
- **Not SaaS cream/sand:** No warm beige backgrounds, no gradient hero metrics, no identical card grids, no all-caps eyebrow-on-every-section scaffolding.  
- **Not forced dark mode:** Light interface throughout; dark chrome is reserved for code/mono elements (JetBrains Mono).

## Motion

**Emil primary (restraint + speed), Jakub secondary (production polish), Jhey selective (empty states only).**

- Row enter: 160ms `cubic-bezier(0.16,1,0.3,1)`, stagger `calc(var(--idx,0) * 20ms)`  
- Page enter: 180ms `cubic-bezier(0.16,1,0.3,1)`, translateY(6px) → 0  
- Slide-in panels: 300ms `cubic-bezier(0.16,1,0.3,1)`, translateX(100%) → 0  
- Tab content: 140ms opacity + translateY(5px) + blur(3px) via `@starting-style`  
- Skeleton shimmer: 1.4s linear, `background-size: 200%`  
- Always: `@media (prefers-reduced-motion: reduce)` disables all animations

## Design tokens (committed system)

```
--bg, --bg-2           backgrounds (neutral light)
--surface              card/panel surface
--border, --hairline   structural / subtle borders
--ink, --ink-2, --ink-3 text ramp
--accent               brand accent (single color)
--accent-soft          tinted accent bg
--accent-ink           text on accent-soft
--success, --warning, --danger   semantic colors
--r-xs, --r-sm, --r-md, --r-pill border-radius scale
--shadow-2             single shadow token
--font-body            DM Sans (14px base, 1.5 line-height)
--font-display         Bricolage Grotesque (headings)
--font-mono            JetBrains Mono (data, IDs, amounts)
```

## Stack

Angular 19 · Signals · TailwindCSS v4 · SCSS per-component · Angular Material (form overrides only) · Firebase / Firestore (realtime WhatsApp) · `@angular/fire`
