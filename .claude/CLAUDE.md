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

**NHIS-demo1** (`projects/NHIS-demo1/`)
- **Domain**: Ghana NHIS Claims Pre-Check Agent
- **Languages**: English (Ghana), Pidgin (future)
- **Base Model**: unsloth/gemma-2-2b-it-bnb-4bit
- **Current State**: Training phase, `finetune` step pending
- **Training Data**: 50 samples (40 train / 5 val / 5 test)

**Ellembelle Education** (`projects/ellembelle-education/`)
- **Domain**: STEM tutoring for Ellembelle District, Ghana
- **Languages**: English (Ghana), Twi, Nzema, Fante
- **Base Model**: google/gemma-2b-it (2B params)
- **Current State**: Discovery phase, `sources` step pending

### Google Drive Integration

**Local Google Drive is mounted at `G:\My Drive\`**

Training data and models sync automatically with Google Colab:

```
G:\My Drive\DataFactory\
├── NHIS-demo1/
│   ├── training_data.jsonl    ← Synced, ready for Colab
│   └── outputs/               ← Trained models sync back here
└── <future-projects>/
```

**Colab Workflow:**
1. Training data is auto-copied to `G:\My Drive\DataFactory\<project>\`
2. Open notebook in Colab, set T4 GPU runtime
3. Trained model saves to `outputs/lora_adapter/`
4. Model syncs back to local Drive automatically

### Real-Time Monitoring (Optional but Recommended)
Training on Colab is often a "black box". Use the built-in webhook bridge to stream loss metrics to your local Forge UI:

1. **Start Tunnel**: `npm run forge:tunnel` -> Copy `.trycloudflare.com` URL
2. **Configure Notebook**: Paste URL into `WEBHOOK_URL` in `02_colab_training.ipynb`
3. **Monitor**: Watch training curves at `http://localhost:3002` while Colab runs

### Quick Commands

```bash
# Validate a dataset
npm run validate:dataset data/training/dataset.jsonl

# Check all gates
npx tsx scripts/check-gates.ts projects/<project-name>

# Create new project
node scripts/create-project.js <name>

# Sync training data to Google Drive (for Colab)
cp projects/<project-name>/data/training/training_data.jsonl "/g/My Drive/DataFactory/<project-name>/"
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

## 📊 Data Scarcity Score Framework

**The Foundational Question**: Should we fine-tune, or is prompting enough?

See `docs/research-system/data-scarcity-score.md` for the complete framework.

### Quick Reference

**Core Principle**: Fine-tune when knowledge is MISSING from base model training data, not when prompting is inconvenient.

### The 40-Point Rubric

| Category | What It Measures | Points |
|----------|------------------|--------|
| Knowledge Exclusivity | How unique is this to your sources? | 0-4 |
| Base Model Failure Rate | How badly does base model fail? | 0-4 |
| Local Context Requirement | How much does local context matter? | 0-4 |
| Terminology Specificity | How specialized is the vocabulary? | 0-4 |
| Format/Structure Requirements | How specific are output needs? | 0-4 |
| Reasoning Pattern Complexity | How specialized is the reasoning? | 0-4 |
| Accuracy Stakes | How critical is domain accuracy? | 0-4 |
| Data Quality Potential | How good can training data be? | 0-4 |
| Evaluation Feasibility | Can you measure improvement? | 0-4 |
| Deployment Viability | Can the model actually be used? | 0-4 |

### Score Interpretation

| Score | Assessment | Action |
|-------|------------|--------|
| **0-16** | Prompting Zone | Use prompts, RAG, or few-shot. Don't fine-tune. |
| **17-26** | Gray Zone | Test both approaches. Fine-tuning might help. |
| **27-34** | Strong Case | Good candidate. Proceed with baseline comparison. |
| **35-40** | Clear Win | Exceptional opportunity. Fine-tuning will add real value. |

### Gate Integration

The `data-scope-defined` gate requires:
- Data Scarcity Score ≥ 20/40 (or justified override)
- Baseline evaluation plan documented
- Success criteria defined before training begins

### Before Fine-Tuning, Always Ask:

1. "Can a well-prompted base model do this?" → If yes, don't fine-tune
2. "What specific knowledge is missing from training data?" → Must be concrete
3. "How will we measure improvement over baseline?" → Must be testable
4. "What tier is our training data?" → Tier 1-3 required (exclusive/scarce/underrepresented)

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

---

## Local Testing & Jupyter Workflow

### Philosophy: Test Locally, Train Remotely

**ALWAYS validate data and debug issues locally before submitting to Google Colab.**

This saves:
- GPU compute costs
- Debugging time (local errors are faster to fix)
- Colab session timeouts from preventable errors

### Two-Part Notebook System

Each project should have two notebooks:

| Notebook | Purpose | Where to Run |
|----------|---------|--------------|
| `01_data_validation.ipynb` | Validate data, check formats, find issues | **Local (JupyterLab)** |
| `02_colab_training.ipynb` | Fine-tune model with GPU | **Google Colab (T4 GPU)** |

### What Can Be Tested Locally (No GPU)

| Task | Local Testing | Notes |
|------|---------------|-------|
| JSONL parsing | ✅ Yes | Catch format errors before upload |
| Required field validation | ✅ Yes | Verify instruction/output fields exist |
| Duplicate detection | ✅ Yes | MD5 hash comparison |
| Token length analysis | ✅ Yes | Word-based approximation |
| Data leakage detection | ✅ Yes | Check train/test overlap |
| Sample preview | ✅ Yes | See how data will look to model |
| Chat template formatting | ✅ Yes | Verify Gemma format is correct |

### What Requires Colab (GPU)

| Task | Requires GPU | Notes |
|------|--------------|-------|
| Model loading | ✅ Yes | 4-bit quantization needs CUDA |
| LoRA adapter creation | ✅ Yes | GPU memory operations |
| Training loop | ✅ Yes | The actual fine-tuning |
| Inference testing | ✅ Yes | Running the trained model |
| Model saving/export | ✅ Yes | Merging weights |

### Local Testing Commands

```bash
# Start JupyterLab for local notebook testing
cd projects/<project-name>
jupyter lab

# Or run validation notebook directly
jupyter execute 01_data_validation.ipynb

# Quick dataset validation without Jupyter
npm run validate:dataset projects/<project-name>/data/training_data.jsonl
```

### Colab Workflow

1. **Prepare locally:**
   - Run `01_data_validation.ipynb` locally
   - Fix any errors it reports
   - Verify "READY FOR TRAINING" message

2. **Upload to Drive:**
   - Create folder: `MyDrive/DataFactory/<project-name>/`
   - Upload `training_data.jsonl`

3. **Run on Colab:**
   - Upload `02_colab_training.ipynb` to Colab
   - Set runtime to T4 GPU
   - Update config cell with your paths
   - Click "Run All"

4. **Download results:**
   - Model saved to `MyDrive/DataFactory/<project-name>/outputs/`
   - Download `lora_adapter/` folder
   - Place in local `models/checkpoints/`

### Project Notebook Structure

```
projects/<project-name>/
├── 01_data_validation.ipynb    # Run locally - validates data
├── 02_colab_training.ipynb     # Run on Colab - trains model
├── data/
│   ├── training_data.jsonl     # Your training data
│   └── raw_claims.jsonl        # Raw source data
├── models/
│   └── checkpoints/
│       └── lora_adapter/       # Downloaded from Colab
└── .env                        # HF_TOKEN (gitignored)
```

### Debugging Checklist

Before uploading to Colab, verify:

- [ ] `01_data_validation.ipynb` shows "READY FOR TRAINING"
- [ ] No parse errors in JSONL
- [ ] No missing required fields (instruction, output)
- [ ] No duplicates (or acceptable number)
- [ ] Sample preview looks correct
- [ ] Token lengths are reasonable (<2048 words)

### Common Local Errors to Fix

| Error | Cause | Fix |
|-------|-------|-----|
| "File not found" | Wrong path in notebook | Update `TRAINING_DATA_PATH` |
| "Invalid JSON on line X" | Malformed JSONL | Fix the specific line |
| "Missing 'instruction'" | Wrong field names | Rename to instruction/output |
| "X duplicates found" | Repeated samples | Deduplicate or accept |
| "Empty field on record X" | Blank instruction/output | Remove or fill in |

### Environment Setup

```bash
# Install JupyterLab (one-time)
pip install jupyterlab

# Install validation dependencies (one-time)
pip install datasets pandas

# Start Jupyter for a project
cd projects/<project-name>
jupyter lab
```

### Integration with Workflow Steps

| Workflow Step | Local Notebook | Colab Notebook |
|---------------|----------------|----------------|
| `format` | ✅ Validate formatted data | - |
| `split` | ✅ Check train/val/test splits | - |
| `baseline` | - | ✅ Run base model eval |
| `finetune` | - | ✅ Run training |
| `evaluate` | - | ✅ Run evaluation |

### Trust Level for Notebooks

**Auto-Proceed:**
- Run local validation notebooks
- Report validation results
- Fix obvious data errors

**Require Approval:**
- Training hyperparameter changes
- Uploading to Colab
- Pushing trained models to HuggingFace

---

## Colab Troubleshooting Guide

### Common Issues and Solutions

#### 1. GPU Not Detected (CUDA available: False)

**Symptom:** `torch.cuda.is_available()` returns False even after selecting T4 GPU.

**Root Cause:** Runtime type change requires full restart. Simply clicking "Save" doesn't activate GPU.

**Solution:**
1. **Runtime → Disconnect and delete runtime** (not just disconnect)
2. **Runtime → Change runtime type → T4 GPU → Save**
3. **Runtime → Run all** (must re-run all cells from scratch)

**Important:** Changing runtime clears ALL state - packages, variables, mounted drives. Everything must be re-executed.

#### 2. Unsloth Installation Fails

**Symptom:** `ERROR: Failed building wheel for xformers`

**Root Cause:** The old install command (`pip install unsloth`) tries to build xformers from source, which fails on Colab.

**Solution:** Use the Colab-optimized install:
```python
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
!pip install --no-deps trl peft accelerate bitsandbytes
```

**Note:** The project template (`factory/templates/project-template/02_colab_training.ipynb`) has been updated with this fix.

#### 3. "Module not found" After Runtime Switch

**Cause:** Packages installed before runtime change are wiped.

**Solution:** Re-run install cell after ANY runtime change (GPU type, restart, etc.)

#### 4. GPU Quota Exhausted

**Symptom:** T4 GPU option is greyed out or unavailable.

**Cause:** Colab free tier has daily/weekly GPU quotas.

**Solutions:**
- Wait a few hours and try again
- Try at off-peak hours (early morning US time)
- Consider Colab Pro for guaranteed GPU access

#### 5. Google Drive Not Mounting

**Symptom:** `drive.mount()` hangs or fails.

**Solutions:**
- Click "Connect to Google Drive" in the popup
- If popup doesn't appear, run cell again
- Clear browser cookies for colab.google.com and retry

### Colab Session Checklist

Before running training, verify each step succeeds:

```
[ ] 1. Runtime set to T4 GPU (Runtime → Change runtime type)
[ ] 2. Google Drive mounted (should see "Mounted at /content/drive")
[ ] 3. Unsloth installed (no errors in install cell)
[ ] 4. GPU check shows "CUDA available: True"
[ ] 5. Data file exists (should show "Data file exists: True")
[ ] 6. Model loaded (should show "✅ Model loaded!")
```

If any step fails, fix it before continuing to the next cell.

### Recovery from Failed State

If Colab gets into a bad state (cells failing, weird errors):

1. **Runtime → Disconnect and delete runtime**
2. Close the Colab tab
3. Reopen the notebook from Drive
4. **Runtime → Change runtime type → T4 GPU**
5. **Runtime → Run all**

This gives you a completely clean slate.
