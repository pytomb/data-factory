# 🔬 Data Factory

**Domain Model Training Platform for AI-Powered Applications**

> Transform raw domain knowledge into fine-tuned language models. The upstream sister to MVP Factory—while MVP Factory builds apps, Data Factory builds the AI brains that power them.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Data Project Selection Guide](#-data-project-selection-guide)
- [Workflow Phases](#-workflow-phases-6-phases-18-steps)
- [Quality Gates](#-quality-gates)
- [Training with Unsloth](#-training-with-unsloth)
- [Data Formats](#-data-formats)
- [Architecture](#-architecture)
- [Commands Reference](#-commands-reference)
- [Integration with MVP Factory](#-integration-with-mvp-factory)
- [Documentation Index](#-documentation-index)

---

## 🎯 Overview

Data Factory guides you through the complete ML pipeline:

```
RAW KNOWLEDGE → CLEAN DATA → TRAINED MODEL → DEPLOYED API
```

### The Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FACTORY PIPELINE                           │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────────┤
│  Discovery  │ Collection  │ Preparation │  Training   │   Deployment   │
├─────────────┼─────────────┼─────────────┼─────────────┼────────────────┤
│ • Domain    │ • Capture   │ • Clean     │ • Baseline  │ • Quantize     │
│ • Sources   │ • Annotate  │ • Format    │ • Finetune  │ • Registry     │
│ • Ethics    │ • Validate  │ • Split     │ • Evaluate  │ • Edge Test    │
└─────────────┴─────────────┴─────────────┴─────────────┴────────────────┘
                                                               │
                                                               ▼
                                                    ┌────────────────────┐
                                                    │    MVP FACTORY     │
                                                    │  (App Building)    │
                                                    └────────────────────┘
```

### Why Data Factory?

| Without Data Factory | With Data Factory |
|---------------------|-------------------|
| Generic AI responses | Domain-specialized AI |
| English-only | Multilingual + dialects |
| Cloud-dependent | Edge-deployable (offline) |
| Expensive inference | Optimized, quantized |
| No quality assurance | 11 quality gates |

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/pytomb/data-factory.git
cd data-factory

# Install dependencies
npm install

# Create a new project
npm run create-project my-ai-tutor --domain education

# Start Forge Web UI
cd apps/forge-web
npm run dev

# Open in browser
# http://localhost:3002
```

### Forge Commands

| Command | Purpose |
|---------|---------|
| `npm run forge` | Start Forge Web UI (port 3002) |
| `npm run create-project <name>` | Create new data project |
| `npm run validate:dataset <path>` | Validate training data |
| `npm run check:gates <project>` | Check quality gate status |

---

## 🎯 Data Project Selection Guide

### How to Choose What Data to Collect

Before starting a data project, evaluate these criteria:

#### 1. Domain Value Assessment

| Factor | Low Value (Skip) | Medium Value (Consider) | High Value (Pursue) |
|--------|------------------|------------------------|---------------------|
| **Unique Knowledge** | Generic info (available online) | Some unique insights | Proprietary expertise not in training data |
| **Language Gap** | Well-represented in LLMs | Underrepresented | Not in any LLM (local dialects, specialized jargon) |
| **Business Impact** | Nice to have | Competitive advantage | Core differentiator |
| **Data Availability** | No access to sources | Difficult to obtain | Ready access to experts/content |

#### 2. Data Scarcity Score

Rate 1-5 on each dimension. Total 15+ = strong candidate for fine-tuning:

| Dimension | 1 (Skip) | 3 (Consider) | 5 (Pursue) |
|-----------|----------|--------------|------------|
| **Corpus Size** | Millions of examples online | Thousands available | <1000 examples anywhere |
| **Language Specificity** | Major world language | Regional language | Local dialect/specialized vocabulary |
| **Domain Depth** | Surface-level general | Professional knowledge | Expert-only insights |
| **Temporal Freshness** | Evergreen content | Updates yearly | Changes frequently |

**Examples:**
- Generic English customer service: Score 4 (skip, use off-the-shelf)
- Ghanaian education with Twi integration: Score 18 (pursue)
- Medical diagnosis for rare diseases: Score 17 (pursue)
- Standard JavaScript documentation: Score 5 (skip)

#### 3. Data Source Quality Matrix

Evaluate each potential data source:

| Source Type | Quality Signal | Risk Factor | Effort Level |
|-------------|----------------|-------------|--------------|
| **Expert Interviews** | High (authentic) | Low volume | High |
| **Textbooks/Curricula** | High (structured) | Copyright | Medium |
| **User-Generated Content** | Variable | Quality inconsistent | Low |
| **Existing Corpora** | Validated | May miss domain nuances | Low |
| **Web Scraping** | Volume | Low quality, legal issues | Medium |
| **Synthetic Generation** | Scalable | Hallucination risk | Medium |

**Ideal Mix:** 40% expert + 30% structured + 20% user-generated + 10% synthetic

#### 4. Fine-Tuning Decision Tree

```
Is generic LLM performance acceptable for your use case?
├── YES → Don't fine-tune, use prompt engineering
└── NO →
    Do you have access to 1000+ quality examples?
    ├── NO → Use RAG (retrieval) instead
    └── YES →
        Is the knowledge time-sensitive?
        ├── YES → Consider RAG + fine-tuning hybrid
        └── NO →
            Does it require specialized vocabulary/style?
            ├── NO → Prompt engineering may suffice
            └── YES → FINE-TUNE with Data Factory
```

#### 5. Cost-Benefit Analysis

| Factor | Calculate |
|--------|-----------|
| **Data Collection Cost** | (Hours × Rate) + Tools + Licensing |
| **Annotation Cost** | Samples × Time per sample × Annotator rate |
| **Training Cost** | GPU hours × Cloud rate (or hardware amortization) |
| **Maintenance Cost** | Updates per year × Collection + Training cost |
| **Total Investment** | Sum of above |

| Factor | Calculate |
|--------|-----------|
| **Inference Savings** | (API calls × API cost) - (Self-hosted cost) |
| **Quality Improvement** | Value of better responses (user satisfaction, conversion) |
| **Competitive Advantage** | Market differentiation value |
| **Total Return** | Sum of above |

**ROI = (Total Return - Total Investment) / Total Investment**

Rule of thumb: Target 3x ROI in first year for data projects.

### Data Project Selection Checklist

```markdown
## Data Project Selection Checklist

### Domain Assessment
- [ ] Knowledge is specialized/proprietary (not generic web content)
- [ ] Language/dialect is underrepresented in existing LLMs
- [ ] Clear business case for domain specialization
- [ ] Estimated Data Scarcity Score: ___/20 (need 15+)

### Data Access
- [ ] Can access 1000+ quality samples
- [ ] Have domain experts for annotation/validation
- [ ] Data sources identified with quality assessment
- [ ] No insurmountable copyright/legal barriers

### Technical Feasibility
- [ ] Target hardware defined (GPU VRAM, edge device specs)
- [ ] Acceptable base model identified (Gemma, Llama, etc.)
- [ ] Training infrastructure available (local/cloud)
- [ ] Evaluation metrics defined

### Ethics & Governance
- [ ] Consent framework for data collection
- [ ] Privacy requirements understood
- [ ] Cultural sensitivity reviewed
- [ ] Data sovereignty requirements met

### Business Case
- [ ] ROI estimated at 3x+ in first year
- [ ] Integration path to product defined
- [ ] Maintenance/update plan in place
- [ ] Stakeholder buy-in obtained
```

---

## 📊 Workflow Phases (6 Phases, 18 Steps)

### Phase 1: Discovery
*What domain knowledge do we need to capture?*

| Step | Agent | Output | Gate |
|------|-------|--------|------|
| `intake` | Domain Researcher | `docs/domain-brief.md` | - |
| `sources` | Source Scout | `docs/data-sources.md` | `sources-identified` |
| `ethics` | Ethics Reviewer | `docs/data-governance.md` | `ethics-approved` |

**Key Questions Answered:**
- What domain are we specializing in?
- What languages and dialects?
- What data sources are available?
- What are the ethical considerations?

### Phase 2: Collection
*Gather and annotate the raw material*

| Step | Agent | Output | Gate |
|------|-------|--------|------|
| `capture` | Data Collector | `data/raw/` | - |
| `annotate` | Annotation Lead | `data/annotated/` | `annotations-validated` |
| `validate` | Quality Validator | `docs/collection-report.md` | `raw-data-quality` |

**Key Questions Answered:**
- How do we collect the data?
- What annotation schema do we use?
- How do we ensure annotation quality?

### Phase 3: Preparation
*Make data training-ready*

| Step | Agent | Output | Gate |
|------|-------|--------|------|
| `clean` | Data Cleaner | `data/cleaned/` | - |
| `format` | Format Converter | `data/training/dataset.jsonl` | - |
| `split` | Split Manager | `data/splits/train.jsonl`, `val.jsonl`, `test.jsonl` | `dataset-validated` |

**Key Questions Answered:**
- How do we normalize the data?
- What's the training format?
- How do we prevent data leakage?

### Phase 4: Training
*Create the specialized model*

| Step | Agent | Output | Gate |
|------|-------|--------|------|
| `baseline` | Baseline Evaluator | `metrics/baseline.json` | `baseline-established` |
| `finetune` | Training Runner | `models/checkpoints/` | - |
| `evaluate` | Model Evaluator | `metrics/evaluation.json` | `model-performance` |

**Key Questions Answered:**
- How does the base model perform?
- What hyperparameters to use?
- Did we beat the baseline?

### Phase 5: Deployment
*Optimize and deploy*

| Step | Agent | Output | Gate |
|------|-------|--------|------|
| `quantize` | Quantization Expert | `models/quantized/` | `quantization-verified` |
| `registry` | Registry Manager | `docs/registry-info.md` | - |
| `edge-test` | Edge Tester | `docs/edge-verification.md` | `deployment-ready` |

**Key Questions Answered:**
- Can we reduce model size for edge?
- Where do we host the model?
- Does it run on target hardware?

### Phase 6: Handoff
*Prepare for product integration*

| Step | Agent | Output | Gate |
|------|-------|--------|------|
| `model-card` | Documentation Writer | `docs/model-card.md` | - |
| `api-spec` | API Designer | `docs/inference-api.md` | - |
| `examples` | Example Curator | `docs/prompt-examples.md` | `integration-ready` |

**Key Questions Answered:**
- What are the model's capabilities and limitations?
- How do applications call the model?
- What prompts work best?

---

## 🚧 Quality Gates

Gates **BLOCK** progress until satisfied:

| Gate | Requirement | How to Pass |
|------|-------------|-------------|
| `sources-identified` | Data sources catalogued | Document 3+ sources with access method |
| `ethics-approved` | Governance reviewed | Consent documented, privacy addressed |
| `raw-data-quality` | 1000+ samples, 80%+ coverage | Collect sufficient diverse data |
| `annotations-validated` | 85%+ inter-annotator agreement | Calibrate annotators, resolve conflicts |
| `dataset-validated` | No duplicates, no leakage | Run validation scripts |
| `baseline-established` | Base model measured | Evaluate before training |
| `model-performance` | +20% improvement over baseline | Fine-tune until threshold met |
| `quantization-verified` | Quality maintained | <5% accuracy drop from full model |
| `deployment-ready` | Runs on target hardware | Test on actual device |
| `integration-ready` | Model card + API + examples | Complete documentation |

---

## ⚡ Training with Unsloth

Data Factory uses [Unsloth](https://github.com/unslothai/unsloth) for efficient fine-tuning:

### Why Unsloth?

| Metric | Standard Training | Unsloth |
|--------|-------------------|---------|
| **VRAM Usage** | 24GB+ | 8GB |
| **Training Speed** | Baseline | 2-5x faster |
| **Quantization** | Separate step | Built-in |
| **LoRA Support** | Manual setup | Automatic |

### Supported Models

| Model | Unsloth ID | VRAM | Best For |
|-------|-----------|------|----------|
| Gemma 3 4B | `unsloth/gemma-3-4b-it` | 8GB | Multilingual, general |
| Gemma 3 12B | `unsloth/gemma-3-12b-it` | 16GB | Higher quality |
| Gemma 3 27B | `unsloth/gemma-3-27b-it` | 24GB | Best quality, 128k context |
| Llama 3.1 8B | `unsloth/Llama-3.1-8B-Instruct` | 10GB | Strong reasoning |
| Mistral 7B | `unsloth/Mistral-7B-Instruct-v0.3` | 8GB | Fast, efficient |
| Qwen 2.5 7B | `unsloth/Qwen2.5-7B-Instruct` | 10GB | Coding, multilingual |

### Hardware Requirements

| Your GPU VRAM | Recommended Model | Batch Size | Training Time (1000 samples) |
|---------------|-------------------|------------|------------------------------|
| 8GB | Gemma 3 4B | 1 | 30-60 min |
| 12-16GB | Gemma 3 4B or 12B | 2 | 30-90 min |
| 24GB | Any up to 27B | 4 | 1-4 hours |
| 48GB+ | Gemma 3 27B | 8 | 2-4 hours |

### Quick Training Example

```python
from unsloth import FastModel
from trl import SFTTrainer, SFTConfig

# Load model in 4-bit (saves VRAM)
model, tokenizer = FastModel.from_pretrained(
    "unsloth/gemma-3-4b-it",
    load_in_4bit=True
)

# Add LoRA adapters (train only ~1% of parameters)
model = FastModel.get_peft_model(model, r=8, lora_alpha=16)

# Train
trainer = SFTTrainer(model, train_dataset=dataset, ...)
trainer.train()

# Save GGUF for edge deployment
model.save_pretrained_gguf("models/quantized", quantization_method="Q8_0")
```

See [docs/tech-system/unsloth-finetuning.md](docs/tech-system/unsloth-finetuning.md) for the complete guide.

---

## 📁 Data Formats

### Training Data (JSONL)

The standard format for fine-tuning:

```json
{
  "instruction": "You are a STEM tutor for students in Ghana.",
  "input": "How do I calculate profit if I buy yams for 10 cedis and sell for 15?",
  "output": "Medaaase! Profit = Selling Price - Buying Price = 15 - 10 = 5 cedis."
}
```

### ShareGPT Format (for Unsloth)

Unsloth prefers conversational format:

```json
{
  "conversations": [
    {"role": "system", "content": "You are a STEM tutor for Ghana."},
    {"role": "user", "content": "How do I calculate profit?"},
    {"role": "assistant", "content": "Medaaase! Profit = Selling - Buying..."}
  ]
}
```

### Annotation Format

For tracking data provenance:

```json
{
  "id": "sample-001",
  "source": {"id": "ghana-curriculum", "type": "curriculum"},
  "raw_text": "Original content",
  "cleaned_text": "Processed content",
  "annotations": {
    "topic": "arithmetic",
    "difficulty": "middle",
    "language": "en-gh",
    "dialect_markers": ["cedis", "Medaaase"],
    "local_context": ["yams", "market"]
  },
  "quality_score": 95,
  "annotator": "expert-001"
}
```

---

## 🏗️ Architecture

```
data-factory-template/
├── .claude/
│   └── CLAUDE.md              # AI agent instructions
├── apps/
│   └── forge-web/             # Forge Command Center (Next.js)
│       ├── app/
│       │   ├── api/           # 14 API routes
│       │   │   ├── state/     # Workflow state
│       │   │   ├── training/  # Training progress
│       │   │   ├── dataset/   # Dataset management
│       │   │   └── model/     # Model metrics
│       │   └── page.tsx       # Main dashboard
│       ├── components/        # React components
│       │   ├── Dashboard.tsx
│       │   ├── StepTimeline.tsx
│       │   ├── TrainingProgress.tsx
│       │   ├── DatasetStats.tsx
│       │   └── ModelMetrics.tsx
│       └── lib/               # Core libraries
│           ├── workflow.ts    # 6 phases, 18 steps
│           ├── gates.ts       # 11 quality gates
│           └── state-manager.ts
├── docs/
│   ├── tech-system/
│   │   ├── unsloth-finetuning.md   # Training guide
│   │   └── package-research.md      # Package Scout
│   └── prompts/
│       └── training/
│           └── training-runner.md   # Agent prompt
├── factory/
│   └── schemas/               # JSON schemas
│       ├── training-data.schema.json
│       ├── training-config.schema.json
│       ├── annotation.schema.json
│       └── model-card.schema.json
├── projects/                  # Your data projects
│   └── ellembelle-education/  # Example project
│       ├── .factory/          # Project state
│       ├── data/              # Raw → Annotated → Training
│       ├── models/            # Checkpoints, quantized
│       ├── docs/              # Domain documentation
│       └── metrics/           # Evaluation results
└── scripts/                   # Automation
    ├── create-project.js
    ├── validate-dataset.js
    └── check-gates.js
```

---

## 🔧 Commands Reference

### Project Management

```bash
# Create new project
npm run create-project my-project --domain education

# Check project status
node scripts/check-gates.js projects/my-project

# Validate dataset
node scripts/validate-dataset.js projects/my-project/data/training/dataset.jsonl
```

### Forge Web UI

```bash
# Start Forge Command Center
cd apps/forge-web
npm run dev

# Build for production
npm run build
```

### Training (Python)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install Unsloth
pip install unsloth

# Run training script
python scripts/train.py --config projects/my-project/training-config.json
```

---

## 🔗 Integration with MVP Factory

Data Factory produces models that MVP Factory consumes:

```
DATA FACTORY                              MVP FACTORY
────────────                              ───────────
domain-brief.md ────────────────────────► intent.md (context)
model-card.md ──────────────────────────► tech-notes.md (integration)
inference-api.md ───────────────────────► API implementation
prompt-examples.md ─────────────────────► User experience

models/quantized/*.gguf ────────────────► Edge deployment
HuggingFace model ID ───────────────────► Cloud inference
```

### Handoff Artifacts

| Artifact | Purpose | MVP Factory Consumes |
|----------|---------|---------------------|
| `model-card.md` | Capabilities, limitations, biases | Tech planning |
| `inference-api.md` | Input/output format, parameters | API implementation |
| `prompt-examples.md` | What works, what doesn't | UX design |
| `models/quantized/` | Optimized weights | Edge deployment |
| HuggingFace ID | Cloud-hosted model | API integration |

### Integration Command

In MVP Factory, reference the trained model:

```bash
/factory --model dnice1975/ellembelle-tutor-v1
```

---

## 📚 Documentation Index

### Core Documentation

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](.claude/CLAUDE.md) | AI agent instructions |
| [README.md](README.md) | This file |

### Technical Guides

| Guide | Location | Purpose |
|-------|----------|---------|
| Unsloth Fine-Tuning | `docs/tech-system/unsloth-finetuning.md` | Complete training guide |
| Package Research | `docs/tech-system/package-research.md` | Don't reinvent wheels |
| Training Runner | `docs/prompts/training/training-runner.md` | Agent prompt for training |

### Schemas

| Schema | Location | Purpose |
|--------|----------|---------|
| Training Data | `factory/schemas/training-data.schema.json` | Instruction/input/output format |
| Training Config | `factory/schemas/training-config.schema.json` | Unsloth hyperparameters |
| Annotation | `factory/schemas/annotation.schema.json` | Data provenance tracking |
| Model Card | `factory/schemas/model-card.schema.json` | Model documentation |

---

## 🧪 Example Project: Ellembelle Education

The first Data Factory project—an AI STEM tutor for rural Ghana:

| Attribute | Value |
|-----------|-------|
| **Domain** | Education (STEM tutoring) |
| **Languages** | English (Ghana), Twi, Nzema, Fante |
| **Base Model** | `unsloth/gemma-3-4b-it` |
| **Target** | Edge deployment (4GB RAM, offline-capable) |
| **Status** | Discovery phase |

**Why This Project?**

- **Data Scarcity Score: 18/20** — Local dialects, Ghanaian curriculum, cultural context
- **Unique Value** — No existing LLM handles Twi/Nzema STEM education
- **Clear ROI** — Enables offline tutoring in areas without reliable internet
- **Expert Access** — Partnership with local educators

Location: `projects/ellembelle-education/`

---

## 🔒 Ethics & Governance

Data Factory includes governance frameworks:

### Data Collection Ethics

| Concern | Mitigation |
|---------|------------|
| **Consent** | Documented consent for all human-generated content |
| **Privacy** | PII removed before training, anonymization |
| **Sovereignty** | Data stored per local regulations |
| **Bias** | Diverse sources, annotator calibration |
| **Copyright** | Licensing verified, fair use documented |

### Model Ethics

| Concern | Mitigation |
|---------|------------|
| **Harmful Output** | Evaluation for toxic/harmful content |
| **Hallucination** | Domain-specific factual validation |
| **Misuse** | Model card documents intended use |
| **Access** | Appropriate licensing (open vs restricted) |

---

## 🤝 Contributing

This is part of the **Ekow Solutions Group Factory Suite**:

- [MVP Factory](https://github.com/pytomb/mvp-factory) - Build software products
- [Data Factory](https://github.com/pytomb/data-factory) - Train domain models

See [CLAUDE.md](.claude/CLAUDE.md) for development guidelines.

---

## 📄 License

MIT

---

Built with ❤️ by [Ekow Solutions Group](https://ekow.solutions)

*"Beyond the basics, without the overwhelm"*
