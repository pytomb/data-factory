import argparse
import os
import torch
import json
from transformers import AutoTokenizer, AutoModelForCausalLM
from dotenv import load_dotenv

# Load Environment from .env file (gitignored)
load_dotenv()
TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = "google/gemma-3-4b-it"

def load_file(path):
    if not os.path.exists(path):
        print(f"❌ Error: File not found: {path}")
        return None
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def generate_strategy(dossier_path, prompt_path, output_path):
    print("\n🧠 Initializing Analyst Engine (Gemma 3 Local)...")
    
    # 1. Load Context
    dossier = load_file(dossier_path)
    system_prompt = load_file(prompt_path)
    
    if not dossier or not system_prompt:
        return

    # Truncate dossier if too massive (simple safeguard for CPU speed)
    # Gemma 3 has large context, but CPU generation is slow.
    if len(dossier) > 12000: 
        print(f"⚠️  Dossier is large ({len(dossier)} chars). Truncating to first 12k chars for speed.")
        dossier = dossier[:12000] + "\n...[TRUNCATED]..."

    # 2. Construct Prompt
    # Gemma 3 chat template format
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Here is the Research Dossier for the target organization. Analyze it strictly according to your system instructions.\n\n=== DOSSIER BEGIN ===\n{dossier}\n=== DOSSIER END ==="}
    ]

    # 3. Load Model (CPU Optimized)
    print("⚙️  Loading Model (CPU Mode)... this may take a moment.")
    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, token=TOKEN)
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            token=TOKEN,
            device_map="cpu", # Explicit CPU
            torch_dtype=torch.float32, # CPU friendly
            low_cpu_mem_usage=True
        )
    except Exception as e:
        print(f"❌ Model Load Error: {e}")
        return

    # 4. Generate
    print("🤔 Analyst is thinking... (Generating Report)")
    input_ids = tokenizer.apply_chat_template(messages, return_tensors="pt", add_generation_prompt=True).to(model.device)
    
    outputs = model.generate(
        input_ids,
        max_new_tokens=1024, # Allow for detailed report
        temperature=0.7,
        do_sample=True,
        repetition_penalty=1.1
    )

    # 5. Decode and Save
    response = tokenizer.decode(outputs[0][input_ids.shape[-1]:], skip_special_tokens=True)
    
    print("\n✅ Analysis Complete.")
    
    # Save as Markdown
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(response)
    print(f"📄 Report saved to: {output_path}")

    # Attempt to extract "True North" for downstream tools (Simple keyword extraction)
    # In a production version, we'd enforce JSON output.
    return response

def main():
    parser = argparse.ArgumentParser(description="Gemma Lab Analyst Engine")
    parser.add_argument("--dossier", default="research_dossier.txt", help="Path to research text")
    parser.add_argument("--prompt", default="analyst_prompt.md", help="Path to system prompt")
    parser.add_argument("--output", default="generated_strategy_report.md", help="Output filename")
    
    args = parser.parse_args()
    
    generate_strategy(args.dossier, args.prompt, args.output)

if __name__ == "__main__":
    main()
