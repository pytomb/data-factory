import argparse
import os
import json
import glob
from typing import List, Dict, Any
from transformers import AutoTokenizer

# Configuration
MODEL_ID = "google/gemma-3-4b-it"

def consult_mode():
    """Interactive questionnaire to guide the user."""
    print("\n=== 🩺 Gemma Lab Data Doctor: Consultation ===\n")
    print("I'll ask a few questions to recommend a data strategy.\n")

    goal = input("1. What is your main goal? (e.g., 'Chatbot', 'Code Assistant', 'Style Mimic', 'Reasoner'): ").strip().lower()
    
    print("\n--- Recommendation ---")
    if "chat" in goal or "assistant" in goal:
        print("🎯 Strategy: **Instruction Tuning**")
        print("   - Format: JSON files with 'instruction', 'input' (optional), and 'output' fields.")
        print("   - Volume: 500+ high-quality examples for a robust conversationalist.")
        print("   - Example: {\"instruction\": \"Explain quantum physics\", \"output\": \"...\"}")
    
    elif "style" in goal or "mimic" in goal:
        print("🎯 Strategy: **Continued Pre-training (Style Transfer)**")
        print("   - Format: Raw text (.txt) files containing the target writing style.")
        print("   - Volume: 2,000+ lines of text (approx 1MB+).")
        print("   - Note: This is simpler but requires more data to be effective.")

    elif "code" in goal:
        print("🎯 Strategy: **Code Tuning**")
        print("   - Format: JSONL with 'instruction' (problem) and 'output' (solution code).")
        print("   - Volume: 100-500 examples of pure code solutions.")
    
    else:
        print(f"🎯 Strategy: **General Fine-Tuning** for '{goal}'")
        print("   - Start with **Instruction Tuning** (JSONL format) as it's the most versatile.")
        print("   - Aim for at least 100 diverse examples to see a change in behavior.")
    
    print("\nNext Step: Organise your data into a folder and run: `data_doctor.py audit <folder_path>`")

def audit_mode(folder_path):
    """Scans a folder and evaluates data readiness."""
    print(f"\n=== 🩺 Gemma Lab Data Doctor: Audit Report ===\n")
    print(f"Scanning: {folder_path}")

    if not os.path.exists(folder_path):
        print("❌ Error: Path does not exist!")
        return

    files = glob.glob(os.path.join(folder_path, "**"), recursive=True)
    files = [f for f in files if os.path.isfile(f) and f.endswith(('.json', '.jsonl', '.txt', '.csv'))]

    if not files:
        print("❌ Warning: No compatible files (.json, .jsonl, .txt, .csv) found.")
        return

    print(f"Found {len(files)} potential data files.")
    
    total_tokens = 0
    total_examples = 0
    issues = []

    # Try loading tokenizer (might be slow first time)
    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
        print("✅ Tokenizer loaded for accurate counts.")
    except:
        print("⚠️  Warning: Could not load tokenizer (internet/auth issue?). Using approximation (1 word ≈ 1.3 tokens).")
        tokenizer = None

    for f_path in files:
        file_tokens = 0
        file_examples = 0
        
        try:
            with open(f_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Format Check: JSON/JSONL
                if f_path.endswith(('.json', '.jsonl')):
                    try:
                        data = []
                        if f_path.endswith('.jsonl'):
                            for line in content.splitlines():
                                if line.strip(): data.append(json.loads(line))
                        else:
                            data = json.loads(content)
                            if isinstance(data, dict): data = [data] # Handle single object
                        
                        if not isinstance(data, list):
                            issues.append(f"{os.path.basename(f_path)}: Root element must be a list.")
                            continue

                        file_examples = len(data)
                        
                        # Content Check
                        for i, item in enumerate(data):
                            if 'output' not in item and 'response' not in item:
                                issues.append(f"{os.path.basename(f_path)} (Item {i}): Missing 'output' field.")
                            
                            # Token count string representation of dict
                            text_repr = json.dumps(item) 
                            if tokenizer:
                                file_tokens += len(tokenizer.encode(text_repr))
                            else:
                                file_tokens += len(text_repr.split()) * 1.3 # Crude approx

                    except json.JSONDecodeError:
                        issues.append(f"{os.path.basename(f_path)}: Invalid JSON syntax.")
                
                # Format Check: Plain Text/CSV
                else:
                    # Treat lines as rough examples for text
                    file_examples = len(content.splitlines())
                    if tokenizer:
                        file_tokens += len(tokenizer.encode(content))
                    else:
                        file_tokens += len(content.split()) * 1.3

        except Exception as e:
            issues.append(f"{os.path.basename(f_path)}: Read Error - {str(e)}")

        total_tokens += file_tokens
        total_examples += file_examples

    # --- REPORT ---
    print("\n--- 📊 Dataset Vitals ---")
    print(f"Total Files:    {len(files)}")
    print(f"Total Examples: {total_examples} (approx)")
    print(f"Total Tokens:   {int(total_tokens):,} (approx)")
    
    print("\n--- 🏥 Health Check ---")
    if issues:
        print(f"⚠️  Found {len(issues)} Issues:")
        for i in issues[:5]: # Show top 5
            print(f"   - {i}")
        if len(issues) > 5: print(f"   ...and {len(issues)-5} more.")
    else:
        print("✅ No formatting errors detected.")

    print("\n--- 🩺 Doctor's Diagnosis ---")
    
    readiness_score = 0
    if total_examples > 10: readiness_score += 1
    if total_examples > 100: readiness_score += 1
    if total_tokens > 10000: readiness_score += 1
    if not issues: readiness_score += 1

    if readiness_score >= 4:
        print("🟢 **Excellent**: Data volume and health look great for fine-tuning!")
    elif readiness_score >= 2:
        print("🟡 **Fair**: You have enough to start, but more data would improve results.")
        if total_examples < 100: print("   -> Tip: Aim for at least 100 examples for noticeable results.")
    else:
        print("🔴 **Needs Work**: Dataset is too small or has too many errors.")
        print("   -> Tip: Fix JSON errors or gather more text before training.")

def main():
    parser = argparse.ArgumentParser(description="Gemma Lab Data Doctor")
    subparsers = parser.add_subparsers(dest="command", help="Mode of operation")

    subparsers.add_parser("consult", help="Interactive guide to choose a strategy")
    
    audit_parser = subparsers.add_parser("audit", help="Evaluate a dataset folder")
    audit_parser.add_argument("path", help="Path to data folder")

    args = parser.parse_args()

    if args.command == "consult":
        consult_mode()
    elif args.command == "audit":
        audit_mode(args.path)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
