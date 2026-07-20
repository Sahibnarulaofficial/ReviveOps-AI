**ReviveOps AI | Autonomous Product Recovery Operations Manager**

An Agentic AI system that intelligently analyzes returned products, determines their optimal lifecycle, and generates optimized daily recovery plans to maximize value recovery and minimize waste.



========================================================================

&#x20;            REVIVEOPS AI - RECOVERY OPERATIONS CENTER TUTORIAL

========================================================================



Welcome to the ReviveOps AI Recovery Operations Center! This system enables

operators to parse equipment inventories, run AI-driven recoverability 

assessments, and compute optimized daily recovery plans under resource 

constraints.



This tutorial guides you through the available features, inputs, and options.



\------------------------------------------------------------------------

1\. OPERATIONAL CONSTRAINTS INPUTS

\------------------------------------------------------------------------

Before processing an inventory CSV file, you can specify constraints on the 

uploader card:



A. Available Operations Budget (₹):

&#x20;  \* This defines the total financial budget available for today's recovery shift.

&#x20;  \* Sorting \& Cost Calculations:

&#x20;    - REPAIR decisions consume the FULL estimated repair cost.

&#x20;    - RECYCLE decisions consume 15% of the repair cost (logistics/handling).

&#x20;    - SCRAP decisions consume 10% of the repair cost (disposal fees).

&#x20;    - RESELL decisions consume 5% of the repair cost (listing fees).

&#x20;    - REUSE decisions consume a flat ₹100 checkup/cleaning fee.

&#x20;  \* If budget limits are exceeded, lower ROI assets are deferred.



B. Available Shift Duration (Hours):

&#x20;  \* This defines the total labour shift time available today.

&#x20;  \* Processing Duration Rules:

&#x20;    - REPAIR: Electronics = 2.5 hours, Appliances = 3.5 hours, 

&#x20;      Furniture = 2.0 hours, Others = 3.0 hours.

&#x20;    - RECYCLE: 1.5 hours.

&#x20;    - RESELL: 1.0 hour.

&#x20;    - REUSE \& SCRAP: 0.5 hours.

&#x20;  \* If total shift hours are exceeded, assets are deferred.



\------------------------------------------------------------------------

2\. CSV INVENTORY FILE FORMAT

\------------------------------------------------------------------------

The system accepts standard CSV files. The CSV must contain the following 

exact headers (case-insensitive, spaces trimmed):



\* ID: Unique number identifying the asset (Integer)

\* NAME: The name of the item (String, e.g., "Dell Laptop")

\* CATEGORY: Classification group (String, e.g., "Electronics")

\* CONDITION: Current status (String, e.g., "Good", "Moderate", "Severe")

\* ISSUE\_DESCRIPTION: Text details of what is broken (String)

\* AGE: Age of the asset in years (Integer)

\* ESTIMATED\_REPAIR\_COST: Estimate of repair cost (Decimal/Float)



A template is located at: sample\_data/assets\_sample.csv



\------------------------------------------------------------------------

3\. THE SCHEDULING PRIORITIZATION RULES

\------------------------------------------------------------------------

The Operations Engine prioritizes assets using pure Python logic. When 

processing resources are limited, items are sorted by:

1\. Priority Score: HIGH -> MEDIUM -> LOW (Always schedule high priority first).

2\. Return on Investment (ROI): Calculated as:

&#x20;  (Estimated Salvage Value / Operational Cost spent).

&#x20;  Assets with higher salvage yield per rupee spent are preferred.

3\. ID: Tie-breaker sorting.



\------------------------------------------------------------------------

4\. UNDERSTANDING RESULTS

\------------------------------------------------------------------------

Once the CSV file is parsed, the dashboard updates with dynamic sections:



\* Today's Recovery Plan Tab: Lists all assets scheduled for today's shift.

\* Deferred Assets Tab: Lists assets postponed to a later date due to 

&#x20; exceeding the budget or hour shift constraints.

\* Recovery Overview Stats: Dynamic indicators showing counts of Recoverable, 

&#x20; Repair, Recycle, Reuse, Resell, and Scrap assignments.

\* Recovery Analytics Section: Visual progress bars showing:

&#x20; - Budget Utilization percentage

&#x20; - Shift Hours Utilization progress

&#x20; - Expected Salvage Value Recovery (total salvage value of today's plan)

&#x20; - Waste Reduction percentage (ratio of non-scrap items)

\* Today's Top Priorities Sidebar: Renders the top three highest priority 

&#x20; assets currently scheduled in today's plan.

\* AI Recovery Analysis: Displays explanations of the AI recommendations.



\------------------------------------------------------------------------

5\. AI HEURISTIC FALLBACK MODE

\------------------------------------------------------------------------

The system operates seamlessly without internet connection or API keys:

\* If the Groq LLM API is offline or the GROQ\_API\_KEY environment variable is 

&#x20; missing, the system enters "AI Heuristic Fallback Active" mode.

\* The backend automatically computes assessments using local rule sets 

&#x20; based on age, cost, and condition (e.g. good condition items are routed 

&#x20; to REUSE, severe conditions are routed to RECYCLE/SCRAP, etc.).

\* A warning badge will display in the uploader success bar to alert the 

&#x20; operator that heuristic rules are active.

========================================================================

