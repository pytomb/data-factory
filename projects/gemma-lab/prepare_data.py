import json
import os
import argparse

def format_claim_for_training(raw_record):
    """
    Converts a raw claim record into an Instruction-Tuning Example.
    Objective: Train model to identify 'Fraud' vs 'Valid' based on service/cost/meds.
    """
    
    # Construct the Prompt (The Input)
    instruction = (
        f"You are a Claims Adjudication Agent for the NHIS.\n"
        f"Analyze the following claim and determine if it should be APPROVED or FLAGGED for fraud.\n\n"
        f"Claim Details:\n"
        f"- Facility: {raw_record['facility']}\n"
        f"- Service: {raw_record['service']}\n"
        f"- Diagnosis: {raw_record['diagnosis']}\n"
        f"- Cost: GHS {raw_record['total_cost_ghs']}\n"
        f"- Medications: {', '.join(raw_record['medications'])}\n\n"
        f"Decision:"
    )

    # Construct the Completion (The Output)
    output = (
        f"{raw_record['status']}\n"
        f"Reasoning: {raw_record['review_note']}"
    )

    return {
        "instruction": instruction,
        "input": "", # Optional, we put everything in instruction for simplicity
        "output": output
    }

def main():
    parser = argparse.ArgumentParser(description="Prepare NHIS Data for Fine-Tuning")
    parser.add_argument("--input", default="data/raw_claims.jsonl", help="Input raw JSONL")
    parser.add_argument("--output", default="data/training_data.jsonl", help="Output training JSONL")
    args = parser.parse_args()

    print(f"🔨 Converting {args.input} -> {args.output}...")
    
    if not os.path.exists(args.input):
        print(f"❌ Error: Input file {args.input} not found.")
        return

    count = 0
    with open(args.input, 'r', encoding='utf-8') as fin, \
         open(args.output, 'w', encoding='utf-8') as fout:
        
        for line in fin:
            if not line.strip(): continue
            try:
                raw = json.loads(line)
                training_example = format_claim_for_training(raw)
                fout.write(json.dumps(training_example) + "\n")
                count += 1
            except Exception as e:
                print(f"⚠️ Error parsing line: {e}")

    print(f"✅ Successfully prepared {count} examples.")
    print("Next: Upload `data/training_data.jsonl` to Colab.")

if __name__ == "__main__":
    main()
