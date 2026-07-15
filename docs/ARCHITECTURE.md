# ReviveOps AI - Architecture

## AI Recovery Operations Center

User -\> CSV Upload -\> AI Orchestrator -\> Recovery Units -\> Report
Engine -\> Dashboard

### Recovery Units

1.  Recovery Assessment Unit
    -   Assesses condition, severity, and recovery feasibility.
2.  Recovery Decision Unit
    -   Determines Repair, Reuse, Recycle, Resell, or Scrap decisions.
3.  Recovery Priority Unit
    -   Calculates priority scores and ranks assets.
4.  Recovery Operations Unit
    -   Generates the daily recovery operations plan and analytics.

## Workflow

1.  Upload inventory CSV.
2.  AI analyzes recoverable assets.
3.  AI determines optimal recovery pathways.
4.  AI prioritizes recovery actions.
5.  AI generates the daily recovery plan.
6.  AI produces reports and dashboard analytics.

## Backend Structure

    backend/app/
    ├── orchestrator/
    ├── recovery_assessment/
    ├── recovery_decision/
    ├── recovery_priority/
    ├── recovery_operations/
    ├── routes/
    ├── models/
    ├── services/
    ├── prompts/
    └── utils/

## Frontend Structure

    frontend/src/
    ├── components/
    ├── pages/
    ├── services/
    ├── hooks/
    └── layouts/

## Technology Stack

-   React + TypeScript
-   Tailwind CSS + shadcn/ui
-   FastAPI
-   LangChain
-   Groq (Llama 3.3 70B Versatile)
-   Vercel and Render deployment
