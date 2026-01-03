import os
import torch
import argparse
from transformers import AutoTokenizer, AutoModelForCausalLM
from dotenv import load_dotenv

# Load credentials from .env file (gitignored)
load_dotenv()
TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = "google/gemma-3-4b-it"

def main(args):
    print(f"Loading Base Model: {MODEL_ID}...")
    
    # Base Model
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, token=TOKEN)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        token=TOKEN,
        device_map="auto",
        torch_dtype="auto",
        low_cpu_mem_usage=True
    )

    # Adapter Loading
    if args.adapter:
        print(f"\n🔗 Loading LoRA Adapter from: {args.adapter}")
        from peft import PeftModel
        try:
            model = PeftModel.from_pretrained(model, args.adapter)
            print("✅ Adapter integrated successfully!")
        except Exception as e:
            print(f"❌ Failed to load adapter: {e}")
            return

    print("\n--- Gemma 3 Local Chat (Type 'exit' to quit) ---")
    
    while True:
        try:
            user_input = input("\nUser: ")
            if user_input.lower() in ["exit", "quit"]: break

            # Chat Template
            chat = [{"role": "user", "content": user_input}]
            input_ids = tokenizer.apply_chat_template(chat, return_tensors="pt").to(model.device)

            # Generate
            outputs = model.generate(
                input_ids,
                max_new_tokens=256,
                do_sample=True,
                temperature=0.7
            )
            
            response = tokenizer.decode(outputs[0][input_ids.shape[-1]:], skip_special_tokens=True)
            print(f"Gemma: {response}")
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gemma 3 Local Inference")
    parser.add_argument("--adapter", help="Path to local folder containing fine-tuned adapter (e.g. 'adapters/nhis_model')")
    args = parser.parse_args()
    
    main(args)
