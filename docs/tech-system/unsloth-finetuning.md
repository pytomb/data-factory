# Unsloth Fine-Tuning Integration

> **The Goal**: Fine-tune Gemma 3 (or other supported models) efficiently using Unsloth's optimized 4-bit training, integrated into the Data Factory workflow.

---

## Why Unsloth?

| Metric | Standard Training | Unsloth |
|--------|-------------------|---------|
| VRAM Usage | 24GB+ | 8GB |
| Training Speed | Baseline | 2-5x faster |
| Quantization | Separate step | Built-in |
| LoRA Support | Manual setup | Automatic |
| Memory Efficiency | Standard | Gradient checkpointing |

Unsloth is the **MUST USE** package for fine-tuning in the Data Factory (see `package-research.md`). Don't manually set up LoRA or quantization - Unsloth handles it.

---

## Workflow Integration

The `finetune` step in Phase 4: Training should use Unsloth. Here's how each step connects:

```
Phase 3: Preparation
├── split → data/splits/train.jsonl, val.jsonl, test.jsonl (ShareGPT format)
    ↓
Phase 4: Training
├── baseline → Evaluate base model (unsloth/gemma-3-4b-it)
├── finetune → Run Unsloth training (this spec)
├── evaluate → Test fine-tuned model
    ↓
Phase 5: Deployment
├── quantize → save_pretrained_gguf() already done by Unsloth
```

---

## Supported Models

Unsloth supports these models out of the box:

| Model | Unsloth ID | VRAM (4-bit) | Best For |
|-------|-----------|--------------|----------|
| Gemma 3 4B | `unsloth/gemma-3-4b-it` | 8GB | General, multilingual |
| Gemma 3 12B | `unsloth/gemma-3-12b-it` | 16GB | Higher quality |
| Gemma 3 27B | `unsloth/gemma-3-27b-it` | 24GB | Best quality, 128k context |
| Llama 3.1 8B | `unsloth/Llama-3.1-8B-Instruct` | 10GB | Strong reasoning |
| Mistral 7B | `unsloth/Mistral-7B-Instruct-v0.3` | 8GB | Fast, efficient |
| Qwen 2.5 7B | `unsloth/Qwen2.5-7B-Instruct` | 10GB | Coding, multilingual |

**Recommendation for Ellembelle Education**: Start with `gemma-3-4b-it` - good multilingual support, runs on consumer hardware, instruction-following is excellent.

---

## Training Configuration

### Standard Config (for Gemma 3 4B)

```python
# training-config.yaml (or training-config.json)
{
  "model": {
    "name": "unsloth/gemma-3-4b-it",
    "max_seq_length": 2048,
    "dtype": null,  # Auto-detect (float16 for T4/V100, bfloat16 for Ampere+)
    "load_in_4bit": true
  },
  "lora": {
    "r": 8,  # LoRA rank (8, 16, 32, 64, 128)
    "lora_alpha": 16,
    "lora_dropout": 0,
    "target_modules": [
      "q_proj", "k_proj", "v_proj", "o_proj",
      "gate_proj", "up_proj", "down_proj"
    ],
    "bias": "none",
    "use_gradient_checkpointing": "unsloth",
    "finetune_vision_layers": false,
    "finetune_language_layers": true,
    "finetune_attention_modules": true,
    "finetune_mlp_modules": true
  },
  "training": {
    "per_device_train_batch_size": 2,
    "gradient_accumulation_steps": 4,
    "warmup_steps": 5,
    "max_steps": null,  # null for full training, or set specific number
    "num_train_epochs": 3,
    "learning_rate": 2e-4,
    "lr_scheduler_type": "linear",
    "optim": "adamw_8bit",
    "weight_decay": 0.01,
    "logging_steps": 1,
    "seed": 3407,
    "output_dir": "outputs"
  },
  "dataset": {
    "path": "data/splits/train.jsonl",
    "text_field": "text",
    "chat_template": "gemma-3"
  },
  "save": {
    "lora_path": "models/checkpoints/lora",
    "merged_path": "models/checkpoints/merged",
    "gguf_path": "models/quantized",
    "gguf_quantization": "Q8_0"  # Q8_0, f16, bf16
  }
}
```

### Parameter Guidelines

| Parameter | Low VRAM (8GB) | Medium (16GB) | High (24GB+) |
|-----------|----------------|---------------|--------------|
| `r` (LoRA rank) | 8 | 16 | 32 |
| `batch_size` | 1-2 | 2-4 | 4-8 |
| `gradient_accumulation` | 8 | 4 | 2 |
| `max_seq_length` | 1024 | 2048 | 4096 |

---

## Data Format Requirements

Unsloth expects **ShareGPT-style conversational format**. The Data Factory's `format` step must output this structure:

### ShareGPT Format (Required)

```json
{
  "conversations": [
    {"role": "user", "content": "What is photosynthesis?"},
    {"role": "assistant", "content": "Photosynthesis is how plants make food..."}
  ]
}
```

### Conversion from Data Factory Format

The `training-data.schema.json` uses instruction/input/output format. Convert during the `format` step:

```python
# Convert Data Factory format to ShareGPT
def convert_to_sharegpt(example):
    conversations = []

    # Add system message if instruction is present
    if example.get("instruction"):
        conversations.append({
            "role": "system",
            "content": example["instruction"]
        })

    # Add user message
    if example.get("input"):
        conversations.append({
            "role": "user",
            "content": example["input"]
        })

    # Add assistant response
    conversations.append({
        "role": "assistant",
        "content": example["output"]
    })

    return {"conversations": conversations}
```

---

## Step-by-Step Training Process

### Step 1: Environment Setup

```bash
# Install Unsloth (in virtual environment)
pip install unsloth

# Or for Google Colab (handles dependencies)
pip install --no-deps bitsandbytes accelerate xformers peft trl triton unsloth_zoo
pip install sentencepiece protobuf datasets huggingface_hub hf_transfer
pip install --no-deps unsloth
pip install transformers==4.56.2
pip install --no-deps trl==0.22.2
```

### Step 2: Load Model

```python
from unsloth import FastModel
import torch

model, tokenizer = FastModel.from_pretrained(
    model_name="unsloth/gemma-3-4b-it",
    max_seq_length=2048,
    dtype=None,  # Auto-detect
    load_in_4bit=True
)
```

### Step 3: Add LoRA Adapters

```python
model = FastModel.get_peft_model(
    model,
    r=8,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=3407,
    finetune_vision_layers=False,
    finetune_language_layers=True,
    finetune_attention_modules=True,
    finetune_mlp_modules=True,
)
```

### Step 4: Prepare Data

```python
from datasets import load_dataset
from unsloth.chat_templates import get_chat_template, standardize_data_formats

# Setup chat template
tokenizer = get_chat_template(tokenizer, chat_template="gemma-3")

# Load your dataset
dataset = load_dataset("json", data_files="data/splits/train.jsonl", split="train")

# Standardize to ShareGPT format
dataset = standardize_data_formats(dataset)

# Apply chat template
def formatting_prompts_func(examples):
    convos = examples["conversations"]
    texts = [
        tokenizer.apply_chat_template(
            convo,
            tokenize=False,
            add_generation_prompt=False
        ).removeprefix('<bos>')
        for convo in convos
    ]
    return {"text": texts}

dataset = dataset.map(formatting_prompts_func, batched=True)
```

### Step 5: Configure Trainer

```python
from trl import SFTTrainer, SFTConfig
from unsloth.chat_templates import train_on_responses_only

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=2048,
    dataset_num_proc=2,
    args=SFTConfig(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        max_steps=60,  # Set to None for full training
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=1,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=3407,
        output_dir="outputs",
    ),
)

# CRITICAL: Train only on assistant responses (not user prompts)
trainer = train_on_responses_only(
    trainer,
    instruction_part="<start_of_turn>user\n",
    response_part="<start_of_turn>model\n",
)
```

### Step 6: Run Training

```python
trainer_stats = trainer.train()
```

### Step 7: Save Model

```python
# Option A: Save LoRA adapters only (small, fast)
model.save_pretrained("models/checkpoints/lora")
tokenizer.save_pretrained("models/checkpoints/lora")

# Option B: Save merged model (for vLLM)
model.save_pretrained_merged(
    "models/checkpoints/merged",
    tokenizer,
    save_method="merged_16bit"
)

# Option C: Save GGUF for llama.cpp / Ollama
model.save_pretrained_gguf(
    "models/quantized",
    tokenizer,
    quantization_method="Q8_0"  # or "Q4_K_M", "f16", "bf16"
)
```

---

## Output Artifacts

After training, the Data Factory should have:

```
models/
├── checkpoints/
│   ├── lora/              # LoRA adapters (small, loadable on top of base)
│   │   ├── adapter_config.json
│   │   └── adapter_model.safetensors
│   └── merged/            # Full merged model (for vLLM, TGI)
│       ├── config.json
│       ├── model.safetensors
│       └── tokenizer.json
├── quantized/             # GGUF for edge deployment
│   └── model-Q8_0.gguf
logs/
└── training.log           # Training metrics, loss curve
metrics/
└── training-stats.json    # Final training statistics
```

---

## Inference Testing

After training, test the model:

```python
from transformers import TextStreamer

messages = [
    {"role": "user", "content": [{"type": "text", "text": "What is 5 + 3?"}]}
]

inputs = tokenizer.apply_chat_template(
    messages,
    add_generation_prompt=True,
    tokenize=True,
    return_tensors="pt",
    return_dict=True,
)

streamer = TextStreamer(tokenizer, skip_prompt=True)
_ = model.generate(
    **inputs.to("cuda"),
    max_new_tokens=256,
    temperature=1.0,
    top_p=0.95,
    top_k=64,
    streamer=streamer,
)
```

---

## Integration with Forge Web UI

The `TrainingProgress.tsx` component already polls `/api/training` for status. The training script should update `.factory/training-status.json`:

```json
{
  "running": true,
  "step": 45,
  "total_steps": 100,
  "epoch": 2,
  "total_epochs": 3,
  "loss": 0.4523,
  "learning_rate": 1.8e-4,
  "eta_seconds": 3600,
  "started_at": "2025-01-03T10:00:00Z",
  "checkpoint_at": "2025-01-03T10:30:00Z",
  "error": null
}
```

---

## Hardware Requirements

| Model | Minimum VRAM | Recommended | Estimated Time (1000 samples) |
|-------|-------------|-------------|-------------------------------|
| Gemma 3 4B | 8GB | 12GB | 30-60 min |
| Gemma 3 12B | 16GB | 24GB | 1-2 hours |
| Gemma 3 27B | 24GB | 48GB | 2-4 hours |

**Cloud Options**:
- Google Colab (free): T4 16GB - works for Gemma 3 4B
- Mast Compute: RTX A6000 48GB - works for all models
- RunPod: A100 40GB/80GB - fastest option

---

## Gate Criteria

### `baseline-established` Gate
- Base model evaluated on test set
- Metrics recorded in `metrics/baseline.json`
- Domain-specific evaluation (e.g., localization score)

### `model-performance` Gate
- Fine-tuned model evaluated on same test set
- **Must beat baseline by threshold** (e.g., +20% localization accuracy)
- Training completed without errors
- Loss converged (not diverging)

### `quantization-verified` Gate
- GGUF model generated successfully
- Quality within acceptable degradation (<5% accuracy drop from merged)
- File size appropriate for target hardware

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CUDA out of memory | Reduce `batch_size`, increase `gradient_accumulation` |
| Loss not decreasing | Lower `learning_rate` (try 1e-4), check data quality |
| Model outputs garbage | Verify chat template matches model, check tokenizer |
| Training too slow | Enable `bf16` if on Ampere+, use `use_gradient_checkpointing="unsloth"` |
| Quantized model quality drop | Use Q8_0 instead of Q4, or skip quantization |

---

## Next Steps After Training

1. **Evaluate**: Run `evaluate` step with domain-specific metrics
2. **Quantize**: If not already GGUF, run `quantize` step
3. **Deploy**: Push to HuggingFace or local registry
4. **Handoff**: Create model card and API spec for MVP Factory

---

*Framework Version: 1.0*
*Last Updated: 2025-01-03*
*Based on: Unsloth Gemma 3 notebook + Fahad Mirza tutorial*
