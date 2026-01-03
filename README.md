# Data Factory

**Domain Model Training Platform for AI-Powered Applications**

Data Factory is the **upstream sister** to Launch Factory (formerly MVP Factory). While Launch Factory builds applications, Data Factory builds the **domain-specific AI models** that power those applications.

```
DATA FACTORY                              LAUNCH FACTORY
────────────                              ──────────────
Raw Data → Clean Data → Trained Model ──► Model → App Spec → Working App
```

## Quick Start

### 1. Create a New Project

```bash
cd data-factory-template
npm run create-project my-project-name

# With options:
npm run create-project my-project --domain education --display-name "My AI Tutor"
```

This creates a new project in `projects/my-project-name/` with:
- `.factory/` - State management (config.json, state.json, data-manifest.json)
- `data/` - Raw, annotated, cleaned, training data directories
- `models/` - Checkpoints and quantized model storage
- `docs/` - Domain brief, data sources, governance documents
- `metrics/` and `logs/` - Training metrics and logs

### 2. Start Working on a Project

```bash
# Check project status
node scripts/check-gates.js projects/my-project-name

# Validate a dataset
node scripts/validate-dataset.js projects/my-project-name/data/training/dataset.jsonl
```

### 3. Use the `/forge` Command (Claude Code)

In Claude Code, navigate to your project and run:
```
/forge
```

The orchestrator will:
1. Read the project state
2. Identify the current step
3. Guide you through the workflow

## Workflow Overview

### 6 Phases, 18 Steps

| Phase | Steps | Output |
|-------|-------|--------|
| **Discovery** | intake, sources, ethics | Domain brief, data source inventory, governance framework |
| **Collection** | capture, annotate, validate | Raw data, annotated data, quality report |
| **Preparation** | clean, format, split | Cleaned data, JSONL training format, train/val/test splits |
| **Training** | baseline, finetune, evaluate | Baseline metrics, trained model, evaluation report |
| **Deployment** | quantize, registry, edge-test | Quantized model, HuggingFace push, edge verification |
| **Handoff** | model-card, api-spec, examples | Model documentation, API spec, prompt examples |

### Quality Gates

Progress is blocked until gates pass:

| Gate | Requirement |
|------|-------------|
| `data-scope-defined` | Domain, languages, use cases documented |
| `sources-identified` | Data sources catalogued |
| `ethics-approved` | Consent and governance documented |
| `raw-data-quality` | 1000+ samples, 80%+ coverage, 3+ sources |
| `annotations-validated` | 85%+ inter-annotator agreement |
| `dataset-validated` | No duplicates, no leakage, valid schema |
| `baseline-established` | Base model performance measured |
| `model-performance` | +20% localization improvement over baseline |
| `quantization-verified` | Quantized model maintains quality |
| `deployment-ready` | Runs on target hardware |
| `integration-ready` | Model card, API, examples complete |

## Project Structure

```
data-factory-template/
├── .claude/
│   └── CLAUDE.md              # Claude Code instructions
├── apps/
│   └── forge-web/             # Forge Command Center (planned)
│       └── lib/
│           ├── workflow.ts    # Phase/step definitions
│           ├── gates.ts       # Gate validation logic
│           ├── workflow-executor.ts
│           └── state-manager.ts
├── factory/
│   ├── schemas/               # JSON schemas
│   │   ├── training-data.schema.json
│   │   ├── annotation.schema.json
│   │   └── model-card.schema.json
│   └── templates/
│       └── project-template/  # New project starter
├── scripts/
│   ├── create-project.js      # Create new projects
│   ├── validate-dataset.js    # Validate training data
│   └── check-gates.js         # Check workflow gates
├── projects/                  # Your data projects live here
│   └── ellembelle-education/  # Example project
└── package.json
```

## Data Formats

### Training Data (JSONL)

```json
{"instruction": "You are a STEM tutor for Ghana.", "input": "How do I calculate profit?", "output": "Medaaase! Profit = Selling Price - Cost Price..."}
```

### Annotation Format

```json
{
  "id": "sample-001",
  "source": { "id": "ghana-curriculum", "type": "curriculum" },
  "raw_text": "Original content",
  "cleaned_text": "Processed content",
  "annotations": {
    "topic": "arithmetic",
    "difficulty": "middle",
    "language": "en-gh",
    "dialect_markers": ["cedis"],
    "local_context": ["market"]
  }
}
```

## Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `create-project.js` | Create new data project | `npm run create-project <name>` |
| `validate-dataset.js` | Validate JSONL training data | `npm run validate:dataset <path>` |
| `check-gates.js` | Check workflow gate status | `npm run check:gates <project-path>` |

## Integration with Launch Factory

When a model is ready, Data Factory produces:

1. **Model Artifacts** - Quantized weights, tokenizer, HuggingFace ID
2. **Documentation** - Model card, inference API spec, prompt examples
3. **Integration Config** - JSON config for Launch Factory to consume

Launch Factory can then build applications using the trained model:
```bash
/factory --model dnice1975/ellembelle-tutor-v1
```

## Current Projects

### Ellembelle Education

The first Data Factory project - an AI STEM tutor for rural Ghana.

- **Domain**: Education (STEM tutoring)
- **Languages**: English (Ghana), Twi, Nzema, Fante
- **Base Model**: google/gemma-2b-it
- **Target**: Edge deployment (4GB RAM, offline-capable)
- **Status**: Discovery phase (intake complete, sources next)

Location: `projects/ellembelle-education/`

## Contributing

This is part of the Ekow Solutions Group Factory Suite. See the main CLAUDE.md for development guidelines.

## License

MIT
