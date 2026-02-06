---
created: 2026-02-06T15:17
title: Replace agency copy with generic workspace terminology
area: ui
files:
  - .planning/COPY-CONTEXT.md
---

## Problem

The authenticated app currently uses agency-specific language ("your agency", "Agency Portal", "staff members", etc.) which limits the starter kit to agency use cases. The in-app copy needs to be generic so any business type (plumbers, consultants, agencies) can use it.

Key changes documented in COPY-CONTEXT.md:
- "your agency" → "your workspace" throughout authenticated app
- Sidebar subtitle: "Agency Portal" → dynamic org name
- "Staff Members" → "Team Members"
- "Client Users" → "External Users"
- Onboarding, dashboard, empty states all need agency references removed
- Landing page copy stays unchanged (it correctly targets developers/agencies)

## Solution

Sweep all authenticated app routes and components for agency-specific copy. Use the terminology mapping in `.planning/COPY-CONTEXT.md` as the source of truth. This should be a dedicated phase in the roadmap since it touches multiple components across the app.
