import csv
import io
import os
from typing import List, Optional, Literal
from fastapi import FastAPI, UploadFile, HTTPException, Form, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
from langchain_groq import ChatGroq
from dotenv import load_dotenv

# Load environment variables explicitly from backend/.env
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path=dotenv_path)

app = FastAPI(
    title="ReviveOps AI API",
    description="Backend API for parsing, listing, and running operational constraints calculations on assets.",
    version="3.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured AI Output Model
class AIDecision(BaseModel):
    recoverable: Literal["YES", "NO"] = Field(description="Is the asset recoverable?")
    decision: Literal["REPAIR", "REUSE", "RECYCLE", "RESELL", "SCRAP"] = Field(description="Optimal recovery decision")
    priority: Literal["HIGH", "MEDIUM", "LOW"] = Field(description="Operational priority level")
    reason: str = Field(description="AI explanation of why the decision was made")
    estimated_outcome: str = Field(description="Operational impact statement of the decision")

# Asset Data Model (Enriched with AI results)
class Asset(BaseModel):
    id: int = Field(..., description="Unique identifier of the asset")
    name: str = Field(..., description="Name of the asset")
    category: str = Field(..., description="Category of the asset")
    condition: str = Field(..., description="Condition of the asset")
    issue_description: str = Field(..., description="Description of the issue")
    age: int = Field(..., description="Age of the asset in years")
    estimated_repair_cost: float = Field(..., description="Estimated repair cost in local currency")
    # AI Enrichment fields (Optional, defaulted to None)
    recoverable: Optional[str] = Field(default=None, description="AI determination if the asset is recoverable (YES/NO)")
    decision: Optional[str] = Field(default=None, description="AI recovery decision")
    priority: Optional[str] = Field(default=None, description="AI recovery priority level")
    reason: Optional[str] = Field(default=None, description="AI justification/reasoning text")
    estimated_outcome: Optional[str] = Field(default=None, description="AI estimated operational outcome text")

# Operations Analytics Model
class OperationsMetrics(BaseModel):
    budget_utilization: float = Field(..., description="Percentage of budget utilized (0.0 to 100.0)")
    hours_utilization: str = Field(..., description="Hours utilized out of total available (e.g. '7.5 / 8.0')")
    expected_value_recovery: float = Field(..., description="Total salvage value of today's plan in local currency")

# Structured Upload Response containing all telemetry sets
class UploadResponse(BaseModel):
    assets: List[Asset] = Field(..., description="Full inventory of parsed assets")
    plan: List[Asset] = Field(..., description="Assets scheduled for today's recovery plan")
    deferred: List[Asset] = Field(..., description="Assets deferred due to constraints")
    metrics: OperationsMetrics = Field(..., description="Calculated resource utilization metrics")

# Root health check endpoint
@app.get("/")
def read_root():
    return {"status": "online", "message": "ReviveOps AI API is running"}

# Helper: Map asset processing duration in hours based on decision and category
def get_asset_processing_duration(asset: Asset) -> float:
    dec = asset.decision.upper() if asset.decision else "REUSE"
    cat = asset.category.upper() if asset.category else "ELECTRONICS"
    
    if dec == "REPAIR":
        if "ELECTRONICS" in cat:
            return 2.5
        elif "APPLIANCE" in cat:
            return 3.5
        elif "FURNITURE" in cat:
            return 2.0
        return 3.0
    elif dec == "RECYCLE":
        return 1.5
    elif dec == "REUSE":
        return 0.5
    elif dec == "RESELL":
        return 1.0
    elif dec == "SCRAP":
        return 0.5
    return 1.0

# Helper: Estimate salvage/recovery value yield (Expected Value Recovery)
def get_asset_recovery_value(asset: Asset) -> float:
    dec = asset.decision.upper() if asset.decision else "REUSE"
    cat = asset.category.upper() if asset.category else "ELECTRONICS"
    age = asset.age
    repair_cost = asset.estimated_repair_cost
    
    # Heuristically estimate base original value of the asset
    if "ELECTRONICS" in cat:
        base_val = max(15000.0, repair_cost * 3.5)
    elif "APPLIANCE" in cat:
        base_val = max(25000.0, repair_cost * 2.5)
    elif "FURNITURE" in cat:
        base_val = max(8000.0, repair_cost * 4.0)
    else:
        base_val = max(12000.0, repair_cost * 3.0)
        
    # Depreciation over age
    current_val = base_val * (0.85 ** age)
    
    # Expected return yield based on assigned decision
    if dec == "REPAIR":
        return max(0.0, current_val - repair_cost)
    elif dec == "REUSE":
        return current_val * 0.9
    elif dec == "RESELL":
        return current_val * 0.8
    elif dec == "RECYCLE":
        return current_val * 0.35
    elif dec == "SCRAP":
        return current_val * 0.05
    return 0.0

# Helper: Map actual budget impact/cost to process the decision
def get_asset_budget_cost(asset: Asset) -> float:
    dec = asset.decision.upper() if asset.decision else "REUSE"
    repair_cost = asset.estimated_repair_cost
    
    if dec == "REPAIR":
        return repair_cost
    elif dec == "RECYCLE":
        return repair_cost * 0.15  # Logistics/sorting handling fee
    elif dec == "SCRAP":
        return repair_cost * 0.10  # Safe disposal fee
    elif dec == "REUSE":
        return 100.0  # Flat checkup and cleaning cost
    elif dec == "RESELL":
        return repair_cost * 0.05  # Restocking fee
    return 0.0

# Operations Engine prioritization and allocation logic
def run_operations_engine(assets: List[Asset], budget_limit: float, hours_limit: float) -> dict:
    priority_weight = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
    
    # Enrich and prepare allocation candidate properties
    candidates = []
    for asset in assets:
        p_val = asset.priority.upper() if asset.priority else "MEDIUM"
        p_score = priority_weight.get(p_val, 2)
        
        cost = get_asset_budget_cost(asset)
        val = get_asset_recovery_value(asset)
        duration = get_asset_processing_duration(asset)
        
        # Return on Investment factor
        roi = (val / cost) if cost > 0 else val
        
        candidates.append({
            "asset": asset,
            "p_score": p_score,
            "roi": roi,
            "cost": cost,
            "val": val,
            "duration": duration
        })
        
    # Sort order:
    # 1. Priority score descending (HIGH first)
    # 2. ROI factor descending (Highest profit margins first)
    # 3. Asset ID ascending (tie breaker)
    candidates.sort(key=lambda x: (-x["p_score"], -x["roi"], x["asset"].id))
    
    plan = []
    deferred = []
    spent_budget = 0.0
    spent_hours = 0.0
    expected_value = 0.0
    
    for item in candidates:
        asset = item["asset"]
        cost = item["cost"]
        duration = item["duration"]
        val = item["val"]
        
        # Apply strict constraint checking
        if (spent_budget + cost <= budget_limit) and (spent_hours + duration <= hours_limit):
            spent_budget += cost
            spent_hours += duration
            expected_value += val
            plan.append(asset)
        else:
            deferred.append(asset)
            
    budget_utilization = (spent_budget / budget_limit) * 100.0 if budget_limit > 0 else 0.0
    hours_utilization_str = f"{spent_hours:.1f} / {hours_limit:.1f}"
    
    return {
        "plan": plan,
        "deferred": deferred,
        "metrics": {
            "budget_utilization": round(budget_utilization, 1),
            "hours_utilization": hours_utilization_str,
            "expected_value_recovery": round(expected_value, 2)
        }
    }

# AI Decision Engine invocation
def run_ai_decision_engine(asset_data: dict) -> AIDecision:
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set.")
    
    # Initialize ChatGroq LLM
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.0,
        api_key=groq_api_key,
    )
    
    # Set up structured JSON output parser
    structured_llm = llm.with_structured_output(AIDecision)
    
    # Construct prompt messages
    system_message = (
        "You are an AI recovery operations assistant for ReviveOps AI.\n"
        "Your task is to evaluate the recoverability, optimal recovery decision, operational priority, "
        "reasoning, and estimated operational outcome of the given asset.\n"
        "Rules:\n"
        "1. Set recoverable strictly to 'YES' or 'NO'.\n"
        "2. Set decision strictly to one of: REPAIR, REUSE, RECYCLE, RESELL, SCRAP.\n"
        "3. Set priority strictly to one of: HIGH, MEDIUM, LOW.\n"
        "4. Reason must be a clear, concise AI explanation.\n"
        "5. Estimated outcome must be an operational impact statement."
    )
    
    user_message = (
        f"Asset Details:\n"
        f"Name: {asset_data.get('NAME')}\n"
        f"Category: {asset_data.get('CATEGORY')}\n"
        f"Condition: {asset_data.get('CONDITION')}\n"
        f"Issue Description: {asset_data.get('ISSUE_DESCRIPTION')}\n"
        f"Age: {asset_data.get('AGE')} years\n"
        f"Estimated Repair Cost: {asset_data.get('ESTIMATED_REPAIR_COST')}\n"
    )
    
    messages = [
        ("system", system_message),
        ("user", user_message),
    ]
    
    result = structured_llm.invoke(messages)
    return result

# CSV Upload & Enrichment & Constraints Endpoint
@app.post("/api/upload", response_model=UploadResponse, status_code=status.HTTP_200_OK)
async def upload_csv(
    file: UploadFile,
    budget: float = Form(default=50000.0),
    hours: float = Form(default=8.0)
):
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a standard CSV file (.csv)."
        )

    try:
        # Read file contents and decode to string
        contents = await file.read()
        decoded_content = contents.decode("utf-8")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read or decode file: {str(e)}"
        )

    # Use StringIO to simulate a file for DictReader
    csv_file = io.StringIO(decoded_content)
    
    # Custom sniffing / checking if the CSV is empty
    first_char = csv_file.read(1)
    if not first_char:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded CSV file is empty."
        )
    csv_file.seek(0)

    # Read CSV data
    reader = csv.DictReader(csv_file)
    
    # Check for empty headers
    if not reader.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to parse headers. The CSV file may be malformed or empty."
        )

    # Standardize header names: strip spaces and convert to uppercase for robust matching
    original_headers = reader.fieldnames
    header_mapping = {h.strip().upper(): h for h in original_headers if h is not None}

    required_headers = {
        "ID", "NAME", "CATEGORY", "CONDITION", "ISSUE_DESCRIPTION", "AGE", "ESTIMATED_REPAIR_COST"
    }

    # Verify if all required headers are present
    missing_headers = required_headers - set(header_mapping.keys())
    if missing_headers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns in CSV: {', '.join(missing_headers)}"
        )

    parsed_assets = []
    
    # Iterate through rows and validate
    for line_number, row in enumerate(reader, start=2):
        # Skip empty rows (e.g. trailing newlines)
        if not any(val.strip() for val in row.values() if val is not None):
            continue

        # Extract values using the mapped headers
        normalized_row = {}
        for std_key, orig_key in header_mapping.items():
            val = row.get(orig_key)
            normalized_row[std_key] = val.strip() if val is not None else ""

        # Validate and convert data types
        try:
            # Explicitly parse numbers to provide detailed errors
            try:
                asset_id = int(normalized_row["ID"])
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Data type error at row {line_number}: 'ID' must be an integer, got '{normalized_row['ID']}'."
                )

            try:
                age = int(normalized_row["AGE"])
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Data type error at row {line_number}: 'AGE' must be an integer, got '{normalized_row['AGE']}'."
                )

            try:
                estimated_repair_cost = float(normalized_row["ESTIMATED_REPAIR_COST"])
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Data type error at row {line_number}: 'ESTIMATED_REPAIR_COST' must be a number, got '{normalized_row['ESTIMATED_REPAIR_COST']}'."
                )

            # Call AI Decision Engine
            recoverable = "YES"
            decision = "REUSE"
            priority = "MEDIUM"
            reason = ""
            estimated_outcome = ""
            
            try:
                ai_result = run_ai_decision_engine(normalized_row)
                recoverable = ai_result.recoverable
                decision = ai_result.decision
                priority = ai_result.priority
                reason = ai_result.reason
                estimated_outcome = ai_result.estimated_outcome
            except Exception as e:
                # Log AI failure and run heuristic fallback mode
                print(f"AI Decision Engine failed or offline (Row {line_number}): {str(e)}")
                cond_upper = normalized_row["CONDITION"].strip().upper()
                
                if cond_upper in ["GOOD", "EXCELLENT"]:
                    recoverable = "YES"
                    decision = "REUSE"
                    priority = "LOW"
                    reason = f"Fallback Mode: Condition '{normalized_row['CONDITION']}' is clean. Direct reuse recommended."
                elif cond_upper in ["MODERATE", "FAIR"]:
                    recoverable = "YES"
                    decision = "REPAIR"
                    priority = "HIGH" if estimated_repair_cost < 3000 else "MEDIUM"
                    reason = f"Fallback Mode: Moderate wear. Cost of {estimated_repair_cost} allows repair."
                else:  # SEVERE, POOR, BROKEN
                    if estimated_repair_cost < 1500:
                        recoverable = "YES"
                        decision = "RESELL"
                        priority = "MEDIUM"
                        reason = "Fallback Mode: Severe condition but cheap repair cost. Recommended for resale."
                    else:
                        recoverable = "NO"
                        decision = "RECYCLE"
                        priority = "MEDIUM"
                        reason = f"Fallback Mode: High estimated repair cost ({estimated_repair_cost}) for severe condition."
                
                estimated_outcome = "Fallback telemetry active. Heuristic sorting rules applied."

            # Build and validate model
            asset = Asset(
                id=asset_id,
                name=normalized_row["NAME"],
                category=normalized_row["CATEGORY"],
                condition=normalized_row["CONDITION"],
                issue_description=normalized_row["ISSUE_DESCRIPTION"],
                age=age,
                estimated_repair_cost=estimated_repair_cost,
                recoverable=recoverable,
                decision=decision,
                priority=priority,
                reason=reason,
                estimated_outcome=estimated_outcome
            )
            parsed_assets.append(asset)

        except ValidationError as val_err:
            # Capture any standard validation errors from pydantic (e.g., missing fields)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Validation error at row {line_number}: {str(val_err.errors()[0]['msg'])}"
            )

    if not parsed_assets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid asset records found in the CSV file."
        )

    # Run the Operations Engine resource constraints check
    ops_result = run_operations_engine(parsed_assets, budget, hours)

    return UploadResponse(
        assets=parsed_assets,
        plan=ops_result["plan"],
        deferred=ops_result["deferred"],
        metrics=OperationsMetrics(
            budget_utilization=ops_result["metrics"]["budget_utilization"],
            hours_utilization=ops_result["metrics"]["hours_utilization"],
            expected_value_recovery=ops_result["metrics"]["expected_value_recovery"]
        )
    )
