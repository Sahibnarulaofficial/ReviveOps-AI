import csv
import io
from typing import List
from fastapi import FastAPI, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

app = FastAPI(
    title="ReviveOps AI API",
    description="Backend API for parsing and listing recoverable assets.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local development and deployment flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Asset Data Model
class Asset(BaseModel):
    id: int = Field(..., description="Unique identifier of the asset")
    name: str = Field(..., description="Name of the asset")
    category: str = Field(..., description="Category of the asset (e.g., Electronics, Furniture)")
    condition: str = Field(..., description="Condition of the asset (e.g., Good, Moderate, Severe)")
    issue_description: str = Field(..., description="Description of the issue")
    age: int = Field(..., description="Age of the asset in years")
    estimated_repair_cost: float = Field(..., description="Estimated repair cost in local currency")

# Root endpoint for health check
@app.get("/")
def read_root():
    return {"status": "online", "message": "ReviveOps AI API is running"}

# CSV Upload Endpoint
@app.post("/api/upload", response_model=List[Asset], status_code=status.HTTP_200_OK)
async def upload_csv(file: UploadFile):
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

            # Build and validate model
            asset = Asset(
                id=asset_id,
                name=normalized_row["NAME"],
                category=normalized_row["CATEGORY"],
                condition=normalized_row["CONDITION"],
                issue_description=normalized_row["ISSUE_DESCRIPTION"],
                age=age,
                estimated_repair_cost=estimated_repair_cost
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

    return parsed_assets
