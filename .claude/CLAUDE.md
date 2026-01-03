# Data Factory - Domain Model Training Platform

## 🚀 New Session Quick Start

**CRITICAL**: When starting a new Claude Code session in this project, do these steps FIRST before any other work.

### Step 1: Identify Active Projects

```bash
ls projects/
```

This shows all Data Factory projects. Each project has its own workflow state.

### Step 2: Check Project State

```bash
cat projects/<project-name>/.factory/state.json
```

Look for:
- `current_step` - What step needs work
- `steps.<step>.status` - Status of each step (pending, in_progress, completed)

### Step 3: Run Gate Check

```bash
node scripts/check-gates.js projects/<project-name>
```

This shows:
- Which gates have passed
- What's blocking progress
- Specific requirements to satisfy

### Step 4: Take Action Based on Current Step

| Current Step | What to Do |
|--------------|------------|
| `sources` | Research and document data sources in `docs/data-sources.md` |
| `ethics` | Create data governance framework in `docs/data-governance.md` |
| `capture` | Collect raw data into `data/raw/` |
| `annotate` | Label data, save to `data/annotated/` |
| `clean` | Clean and normalize data in `data/cleaned/` |
| `format` | Convert to training format in `data/training/` |
| `finetune` | Run training job, save checkpoints |
| `evaluate` | Run evaluation, document in `docs/model-eval.md` |

### Current Projects

**Ellembelle Education** (`projects/ellembelle-education/`)
- **Domain**: STEM tutoring for Ellembelle District, Ghana
- **Languages**: English (Ghana), Twi, Nzema, Fante
- **Base Model**: google/gemma-2b-it (2B params)
- **Current State**: Discovery phase, `sources` step pending

### Quick Commands

```bash
# Validate a dataset
npm run validate:dataset data/training/dataset.jsonl

# Check all gates
npm run check:gates projects/<project-name>

# Create new project
npm run create-project <name> --domain <domain>
```

---

## Overview

Data Factory is the **upstream sister** to MVP Factory. While MVP Factory builds applications, Data Factory builds the **domain-specific AI models** that power those applications.

```
DATA FACTORY                         MVP FACTORY
────────────                         ───────────
Raw Data → Clean Data → Model   ───►  Model → App Spec → Working MVP
```

## Architecture

```
data-factory-template/
├── .factory/                    # Project state management
│   ├── config.json              # Factory configuration
│   ├── state.json               # Workflow state
│   └── data-manifest.json       # Dataset tracking
├── apps/
│   └── forge-web/               # Data Forge Command Center (Next.js)
│       ├── app/api/             # API routes
│       ├── components/          # React components
│       └── lib/                 # Core libraries
├── factory/
│   ├── schemas/                 # JSON schemas for data formats
│   └── templates/               # Project starter templates
├── scripts/                     # Automation & validation scripts
└── docs/                        # Generated artifacts
    ├── research-system/         # Domain research frameworks
    ├── data-system/             # Data collection/cleaning guides
    └── ml-system/               # Training/evaluation frameworks
```

## Primary Command

**`/forge`** - Invoke the Data Forge Orchestrator to assess project state and coordinate next actions.

The orchestrator:
1. Reads `.factory/state.json` to understand current workflow position
2. Spawns appropriate sub-agents for the current phase
3. Validates data quality and model performance
4. Only asks humans for high-stakes decisions (data ethics, training decisions)

## Workflow Phases

```
PHASE 1: DISCOVERY (What knowledge do we need?)
├── intake       → docs/domain-brief.md
├── sources      → docs/data-sources.md
├── ethics       → docs/data-governance.md
└── GATE: data-scope-defined

PHASE 2: COLLECTION (Gather raw material)
├── capture      → data/raw/
├── annotate     → data/annotated/
├── validate     → docs/annotation-report.md
└── GATE: raw-data-quality

PHASE 3: PREPARATION (Make it training-ready)
├── clean        → data/cleaned/
├── format       → data/training/
├── split        → data/splits/
└── GATE: dataset-validated

PHASE 4: TRAINING (Create the model)
├── baseline     → docs/baseline-eval.md
├── finetune     → models/checkpoints/
├── evaluate     → docs/model-eval.md
└── GATE: model-performance

PHASE 5: DEPLOYMENT (Make it usable)
├── quantize     → models/quantized/
├── registry     → Push to HuggingFace
├── edge-test    → docs/edge-verification.md
└── GATE: deployment-ready

PHASE 6: HANDOFF (Connect to MVP Factory)
├── model-card   → docs/model-card.md
├── api-spec     → docs/inference-api.md
├── examples     → docs/prompt-examples.md
└── GATE: integration-ready
```

## Gates

These gates BLOCK progress until satisfied:

### Phase 1 Gates
- `data-scope-defined` - Domain, languages, use cases documented

### Phase 2 Gates
- `raw-data-quality` - Minimum samples collected, coverage verified
- `ethics-approved` - Data governance reviewed, consent documented

### Phase 3 Gates
- `dataset-validated` - Schema valid, no train/test leakage, quality metrics pass

### Phase 4 Gates
- `baseline-established` - Base model performance measured
- `model-performance` - Fine-tuned model beats baseline by threshold

### Phase 5 Gates
- `quantization-verified` - Quantized model maintains quality
- `deployment-ready` - Model runs on target hardware

### Phase 6 Gates
- `integration-ready` - Model card complete, API documented, examples work

---

## Data Quality Framework

### Collection Quality Metrics

| Metric | Description | Minimum |
|--------|-------------|---------|
| Sample Count | Total training examples | 1,000+ |
| Domain Coverage | % of intended topics covered | 80%+ |
| Language Balance | Distribution across dialects | No single >60% |
| Source Diversity | Number of distinct sources | 3+ |
| Annotation Agreement | Inter-annotator agreement | 85%+ |

### Dataset Validation Checks

```bash
npm run validate:dataset <path>
# Checks:
# - JSONL schema validity
# - No duplicate entries
# - Train/val/test split ratios
# - No data leakage between splits
# - Token length distribution
# - Language detection accuracy
```

---

## Model Evaluation Framework

### Baseline Metrics (Before Fine-tuning)

Measure base model on domain-specific tasks:
- **Localization Score**: Can it use Ghanaian context correctly?
- **Factual Accuracy**: Does it get domain facts right?
- **Language Appropriateness**: Correct dialect usage?

### Fine-tuned Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Localization Improvement | % gain over baseline | +20%+ |
| Perplexity Reduction | Lower = better fit | -15%+ |
| Human Preference | A/B test vs baseline | 70%+ prefer |
| Factual Accuracy | Domain expert review | 90%+ |
| Inference Speed | Tokens/second on target | 10+ |

### Evaluation Script

```bash
npm run evaluate:model <model-path> <eval-dataset>
# Runs:
# - Automated metrics (perplexity, accuracy)
# - Sample generation for human review
# - Comparison against baseline
# - Edge device performance test
```

---

## Data Formats

### Training Data (JSONL)

```json
{"instruction": "System context for the model", "input": "User question", "output": "Expected response"}
```

### Annotation Format

```json
{
  "id": "sample-001",
  "source": "ghana-math-curriculum-jhs2",
  "raw_text": "Original content",
  "cleaned_text": "Processed content",
  "annotations": {
    "topic": "arithmetic",
    "difficulty": "jhs2",
    "language": "en-gh",
    "dialect_markers": ["cedis", "pesewas"],
    "local_context": ["market", "trading"]
  },
  "annotator": "expert-001",
  "reviewed": true
}
```

### Model Card Template

See `docs/ml-system/model-card-template.md` for the required documentation format before handoff to MVP Factory.

---

## Sub-Agent Team

The orchestrator coordinates these specialized agents via the Task tool:

### Data Agents
| Agent | Purpose | When Used |
|-------|---------|-----------|
| `domain-researcher` | Research domain knowledge requirements | Discovery phase |
| `source-scout` | Find and evaluate data sources | Sources step |
| `ethics-reviewer` | Data governance and consent review | Ethics step |

### Quality Agents
| Agent | Purpose | When Used |
|-------|---------|-----------|
| `data-validator` | Validate dataset quality | Preparation phase |
| `annotation-checker` | Verify annotation quality | Collection phase |
| `leakage-detector` | Check for train/test contamination | Split step |

### ML Agents
| Agent | Purpose | When Used |
|-------|---------|-----------|
| `baseline-evaluator` | Measure base model performance | Training phase |
| `training-monitor` | Watch training metrics | Finetune step |
| `model-evaluator` | Comprehensive model evaluation | Evaluate step |

### Deployment Agents
| Agent | Purpose | When Used |
|-------|---------|-----------|
| `quantization-expert` | Optimize model for edge | Quantize step |
| `edge-tester` | Verify edge deployment | Edge-test step |
| `handoff-preparer` | Prepare for MVP Factory | Handoff phase |

---

## Integration with MVP Factory

### Handoff Protocol

When a model is ready, Data Factory produces:

1. **Model Artifacts**
   - Quantized model weights
   - Tokenizer files
   - HuggingFace model ID

2. **Documentation**
   - Model card (capabilities, limitations, biases)
   - Inference API spec
   - Prompt examples that work well

3. **Integration Config**
   ```json
   {
     "model_id": "dnice1975/ellembelle-tutor-v1",
     "model_type": "causal-lm",
     "base_model": "google/gemma-2b-it",
     "quantization": "4bit-nf4",
     "max_tokens": 256,
     "temperature": 0.7,
     "system_prompt": "You are a STEM tutor for students in Ghana...",
     "supported_languages": ["en-gh", "twi", "nzema"],
     "domain": "education",
     "validated_use_cases": ["math-tutoring", "science-explanation"]
   }
   ```

### MVP Factory Receives

When starting an MVP Factory project that uses a Data Factory model:

```bash
/factory --model dnice1975/ellembelle-tutor-v1
```

The MVP Factory will:
1. Pull model card and understand capabilities
2. Constrain design to validated use cases
3. Include model config in tech-notes.md
4. Set up inference in the build phase

---

## Consulting Deliverables

Each step produces artifacts with consulting value:

| Step | Deliverable | Value Range |
|------|-------------|-------------|
| intake | Domain Knowledge Map | $2,000-5,000 |
| sources | Data Source Inventory | $1,500-3,000 |
| ethics | Data Governance Framework | $3,000-8,000 |
| annotate | Annotation Guidelines | $2,000-4,000 |
| format | Training Dataset Package | $5,000-15,000 |
| evaluate | Model Evaluation Report | $3,000-6,000 |
| model-card | Model Documentation | $1,500-3,000 |

---

## Quick Start

```bash
# Create new data project
cd data-factory-template
npm run create-project ellembelle-education

# Start the Forge UI
cd apps/forge-web
npm run dev
# Open http://localhost:3002

# Or use CLI
/forge
```

---

## Trust Levels

**Auto-Proceed (Don't ask, just do):**
- Read data files
- Run validation scripts
- Generate quality reports

**Report First (Tell user what you're doing):**
- Transition between steps
- Run training jobs
- Push to model registry

**Require Approval (Must get OK):**
- Data ethics decisions
- Training hyperparameters
- Model deployment
- Handoff to MVP Factory

---

## Key Differences from MVP Factory

| Aspect | MVP Factory | Data Factory |
|--------|-------------|--------------|
| Primary output | Working application | Trained model |
| UI name | Council Web | Forge Web |
| Command | `/factory` | `/forge` |
| Validation | User testing, QA | Metrics, benchmarks |
| Key expertise | Product, engineering | ML, domain experts |
| Infrastructure | Vercel, databases | GPU compute, storage |
| Time horizon | Weeks | Months |
| Cold start | No users | No data |
