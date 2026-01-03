import json
import random
import uuid
from datetime import datetime, timedelta

# Configuration
OUTPUT_FILE = "data/raw_claims.jsonl"
NUM_RECORDS = 500

# NHIS Context (derived from Research Dossier)
SERVICE_TYPES = [
    "Malaria Treatment", "Ante-Natal Care", "Delivery Services", 
    "Diabetes Management", "Hypertension Review", "Surgery (Hernia)",
    "Pediatric Consultation", "Ultrasound Scan", "Pharmacy Dispensing"
]

FACILITIES = [
    "Korle-Bu Teaching Hospital", "Komfo Anokye Teaching Hospital",
    "Ridge Hospital", "Tema General Hospital", "Kumasi South Hospital",
    "Tamale Teaching Hospital", "Sunyani Regional Hospital"
]

DRUGS = [
    "Artemether-Lumefantrine", "Paracetamol", "Amoxicillin", 
    "Metformin", "Amlodipine", "Oxytocin", "Ciprofloxacin"
]

def generate_claim():
    """Generates a single synthetic claim record."""
    is_fraud = random.random() < 0.15 # 15% fraud rate (simulating the 'Moral Hazard' problem)
    
    # Base Data
    claim_id = str(uuid.uuid4())[:8]
    facility = random.choice(FACILITIES)
    service = random.choice(SERVICE_TYPES)
    date = (datetime.now() - timedelta(days=random.randint(0, 90))).strftime("%Y-%m-%d")
    
    # Logic for Fraud vs Valid
    if is_fraud:
        # Fraud Pattern: Polypharmacy (too many drugs) or Mismatch
        num_drugs = random.randint(5, 8)
        cost = random.randint(500, 2000) # Inflated cost
        diagnosis = "General Malaise" # Vague diagnosis for expensive treatment
        status = "FLAGGED_POSSIBLE_FRAUD"
        analyst_note = "High cost for vague diagnosis; excessive medication count."
    else:
        # Valid Pattern
        num_drugs = random.randint(1, 3)
        cost = random.randint(50, 400)
        diagnosis = service # Consistent
        status = "APPROVED"
        analyst_note = "Standard protocol followed."

    meds = random.sample(DRUGS, min(num_drugs, len(DRUGS)))

    # Construct the "Instruction Tuning" format directly? 
    # Or raw data first? Let's do RAW data first to test the Data Doctor's "Consult" mode later.
    record = {
        "claim_id": claim_id,
        "facility": facility,
        "date": date,
        "service": service,
        "diagnosis": diagnosis,
        "medications": meds,
        "total_cost_ghs": cost,
        "status": status,
        "review_note": analyst_note
    }
    return record

def main():
    print(f"🏥 Generating {NUM_RECORDS} synthetic NHIS claims...")
    
    import os
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for _ in range(NUM_RECORDS):
            record = generate_claim()
            f.write(json.dumps(record) + "\n")
    
    print(f"✅ Data saved to: {OUTPUT_FILE}")
    print("Next: Run 'data_doctor.py audit data/' to validate.")

if __name__ == "__main__":
    main()
