# ReviveOps AI - Project Scope

## Overview
ReviveOps AI is an autonomous AI Recovery Operations Center that analyzes recoverable assets and generates an optimized daily recovery plan to maximize value recovery while minimizing environmental waste.

## Mission
Analyze today's recoverable assets and autonomously determine what should be repaired, reused, recycled, resold, or scrapped, prioritizing actions to maximize salvage return efficiency.

---

## Current Milestone Scope (Foundation & Final UI)
The current implementation focuses strictly on establishing the project's foundation and user interface representation.

### Included in Current Scope:
1. **CSV Parsing Engine**: Backend parsing and validation of uploaded inventories.
2. **Dashboard UI**: Production-ready, dark-themed operations center dashboard.
3. **Recovery Overview Metrics**: Mock cards displaying aggregate stats (Recoverable, Repair, Recycle, Reuse, Resell, Scrap).
4. **Priorities Queue**: Mock representation of today's highest priority items with scores and decisions.
5. **Operational Analytics**: Mock progress indicators for expected value (₹1,85,000), budget (96%), working hours (7.5 / 8), and waste reduction (72%).
6. **AI Explanation Narrative**: Mock justifications for asset decisions.
7. **Compliance Reporting Interface**: "Download Recovery Report" button with a COMING SOON status badge.

### Excluded from Current Scope (No Logic Implemented):
- AI LLM orchestration and logic.
- Priority scoring algorithms.
- Automatic analytics calculations.
- Live report PDF exports.

---

## Target Scope (Production)
When fully completed, ReviveOps AI will feature a fully autonomous workflow.

### Inputs
- Product CSV files containing: `ID`, `NAME`, `CATEGORY`, `CONDITION`, `ISSUE_DESCRIPTION`, `AGE`, and `ESTIMATED_REPAIR_COST`.

### Outputs
- **Recovery Decisions**: Autonomously assigned recovery paths.
- **Priority Rankings**: Chronological ordering of operations.
- **Operations Plan**: Timeline of tasks.
- **Compliance Reports**: Downloadable audit spreadsheets/PDFs.

---

## Core Features Breakdown

### Included features:
- Live CSV parsing and type safety validation.
- Interactive drag-and-drop uploader.
- Responsive, production-grade telemetry dashboard.
- CORS-compliant client-server communications.

### Out-of-Scope features (Global Freeze):
- User authentication and databases.
- OCR / Image scanners.
- Multi-user profiles.
- Automated email / SMS alerts.

---

## SDG Alignment
This project aligns directly with **SDG 12 (Responsible Consumption and Production)** by reducing scrap waste and maximizing recovery yields.
