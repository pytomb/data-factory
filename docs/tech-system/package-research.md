# Package Research Framework (Data Factory)

> **The Goal**: Don't reinvent wheels. Use proven, well-maintained packages instead of custom-building features that already exist.

---

## The Problem

Coding agents (and developers) have a tendency to **custom-build things that should be libraries**. In ML/Data pipelines, this is especially dangerous because:
- Data processing has many edge cases (encoding, formats, validation)
- ML libraries are highly optimized (vectorization, GPU acceleration)
- Statistical calculations require mathematical precision
- File format handling is complex (parquet, arrow, jsonl, csv variants)

Custom implementations are almost always slower, buggier, and harder to maintain.

---

## The Solution: Package Scout Step

**BEFORE implementing any significant feature**, run a Package Scout phase.

### Step 1: Define What You Need

Be specific about requirements:

```markdown
## Feature Requirements

**What we need:**
- [Core functionality]
- [Data format/size constraints]
- [Performance requirements]

**What we DON'T need:**
- [Enterprise features]
- [Over-engineered abstractions]
```

### Step 2: Search for Packages

**Search locations (in order):**
1. **PyPI**: `pip search [term]` or pypi.org
2. **npm registry**: For Node.js data tools
3. **GitHub**: Search with `[feature] + [framework] stars:>1000`
4. **Papers With Code**: For ML-specific implementations
5. **Hugging Face Hub**: For model-related tools

**Quality filters:**
| Metric | Minimum Threshold |
|--------|-------------------|
| Monthly downloads | >50,000 (for critical deps) |
| Last updated | Within 6 months |
| GitHub stars | >500 |
| Open issues ratio | <50% unaddressed |
| Type stubs | Required for Python type checking |

### Step 3: Compare Options

Create a comparison table:

```markdown
## Package Comparison: [Feature]

| Package | Downloads/mo | Last Update | Stars | License | GPU Support |
|---------|-------------|-------------|-------|---------|-------------|
| pkg-a   | 500k        | 2 days ago  | 15k   | MIT     | ✅          |
| pkg-b   | 200k        | 3 months    | 8k    | Apache  | ❌          |
| pkg-c   | 50k         | 1 year      | 2k    | GPL     | ✅          |

**Recommendation:** pkg-a because [reason]
**Rejected:** pkg-c because outdated and GPL license
```

---

## Common Feature → Package Mappings

### MUST USE Packages (Never Build)

#### Data Processing & Transformation
| Feature | Recommended Package | Why Not Build |
|---------|---------------------|---------------|
| DataFrames | `pandas` or `polars` | Optimized C/Rust, extensive API |
| Large datasets | `polars` or `dask` | Memory management, parallelization |
| Data validation | `pydantic` or `pandera` | Schema enforcement, error messages |
| JSON handling | `orjson` or built-in `json` | C-optimized, edge cases |
| CSV parsing | `pandas.read_csv` | Encoding, quoting, chunking |
| Parquet files | `pyarrow` | Industry standard, compression |
| Excel files | `openpyxl` | Format complexity |

#### Machine Learning & AI
| Feature | Recommended Package | Why Not Build |
|---------|---------------------|---------------|
| Tokenization | `transformers` or `tiktoken` | Model-specific, optimized |
| Embeddings | `sentence-transformers` | Pre-trained, batching |
| Fine-tuning | `transformers` + `peft` | LoRA, QLoRA support |
| Quantization | `bitsandbytes` or `auto-gptq` | Hardware optimization |
| Vector storage | `chromadb` or `qdrant` | Similarity search |
| Model serving | `vllm` or `text-generation-inference` | Batching, caching |
| Evaluation | `evaluate` (HF) | Standard metrics |
| Experiment tracking | `wandb` or `mlflow` | Visualization, comparison |

#### Data Quality & Annotation
| Feature | Recommended Package | Why Not Build |
|---------|---------------------|---------------|
| Text cleaning | `ftfy` + `unidecode` | Unicode edge cases |
| Language detection | `langdetect` or `fasttext` | Training data needed |
| Deduplication | `datasketch` (MinHash) | Probabilistic algorithms |
| Annotation UI | `label-studio` | Complex UX requirements |
| Data profiling | `ydata-profiling` | Statistical analysis |

#### Infrastructure & Pipeline
| Feature | Recommended Package | Why Not Build |
|---------|---------------------|---------------|
| Task scheduling | `prefect` or `airflow` | DAG management, retries |
| Progress bars | `tqdm` or `rich` | Terminal handling |
| CLI interfaces | `typer` or `click` | Argument parsing |
| Configuration | `pydantic-settings` | Env vars, validation |
| Logging | `structlog` or `loguru` | Structured, async |
| HTTP clients | `httpx` or `requests` | Connection pooling |
| API frameworks | `fastapi` | Async, validation, docs |

### EVALUATE Before Building

| Feature | Consider Package If... | Build If... |
|---------|------------------------|-------------|
| Custom preprocessing | Standard NLP/CV transforms | Domain-specific logic |
| Data format | Standard (JSON, CSV, Parquet) | Proprietary format |
| Evaluation metric | Standard (accuracy, F1, BLEU) | Novel metric for your task |
| Training loop | Standard fine-tuning | Custom architecture |

---

## Package Research Checklist

Before starting implementation, verify:

```markdown
## Package Research: [Feature Name]

### Requirements Defined
- [ ] Core functionality documented
- [ ] Data format/size constraints noted
- [ ] Performance requirements specified

### Packages Searched
- [ ] PyPI/npm registry checked
- [ ] GitHub alternatives found
- [ ] At least 3 options compared

### Best Option Selected
- [ ] Downloads meet threshold (50k+/month for Python)
- [ ] Updated within 6 months
- [ ] Type support confirmed
- [ ] License compatible (MIT/Apache/BSD preferred)
- [ ] Memory/performance acceptable for data size

### Compatibility Verified
- [ ] Python version compatible
- [ ] Dependency conflicts checked
- [ ] GPU support verified (if needed)
- [ ] Integration test passed

### Decision Documented
- [ ] ADR written with rationale
- [ ] Rejected alternatives noted
- [ ] Integration approach planned
```

---

## Integration with Workflow

### Pre-Implementation Gate

At the `tech` step, before moving to `build`, verify:

1. All data processing features mapped to packages
2. ML components use standard libraries (transformers, pytorch)
3. No custom implementations for standard algorithms
4. Package decisions documented in `docs/tech-notes.md`

### Package Scout Agent Prompt (Python/Data)

```markdown
Research existing packages for: [FEATURE DESCRIPTION]

Requirements:
- [List specific requirements]
- Python version: [3.10+]
- GPU support needed: [yes/no]
- Data size: [approximate]

Find:
1. 3-5 well-maintained packages that could solve this
2. Compare: downloads, update frequency, memory usage
3. Check for dependency conflicts with transformers/torch
4. Recommend the best option with rationale
5. Provide installation and basic usage example
```

### Package Scout Agent Prompt (Node.js/TypeScript)

```markdown
Research existing packages for: [FEATURE DESCRIPTION]

Requirements:
- [List specific requirements]
- Framework: Next.js / Node.js
- TypeScript required: yes

Find:
1. 3-5 well-maintained packages
2. Compare: npm downloads, bundle size, type support
3. Check for SSR compatibility (if Next.js)
4. Recommend the best option with rationale
5. Provide installation and basic usage example
```

---

## Anti-Patterns to Block

| Developer Says | Response |
|----------------|----------|
| "I'll just write a quick tokenizer" | "Use tiktoken or transformers. Tokenization has many edge cases." |
| "I can parse this CSV myself" | "pandas.read_csv handles encoding, quoting, chunks. Don't reinvent." |
| "I'll implement the algorithm from the paper" | "Check Papers With Code for existing implementations first." |
| "I don't want the overhead of pandas" | "Use polars if you need speed. Custom is always slower." |
| "I'll just loop through the data" | "Vectorized operations are 10-100x faster. Use numpy/pandas." |
| "I'll build a simple embedding model" | "sentence-transformers has pre-trained models. Fine-tune if needed." |

---

## Data Factory Specific Guidance

### Phase-Specific Package Recommendations

| Phase | Key Packages |
|-------|-------------|
| **Discovery** | `pandas`, `ydata-profiling` (data exploration) |
| **Collection** | `httpx`, `beautifulsoup4`, `selenium` (scraping) |
| **Preparation** | `ftfy`, `datasketch`, `pandera` (cleaning, dedup, validation) |
| **Training** | `transformers`, `peft`, `bitsandbytes` (fine-tuning) |
| **Deployment** | `vllm`, `fastapi`, `qdrant` (serving, inference) |
| **Handoff** | `mlflow`, `wandb` (experiment tracking, model registry) |

### Common Data Pipeline Stack

```python
# Data Processing
pandas / polars       # DataFrames
pyarrow              # Parquet files
orjson               # Fast JSON
pydantic             # Validation

# ML/Training
transformers         # Models
datasets             # HF datasets
peft                 # Efficient fine-tuning
accelerate           # Multi-GPU
bitsandbytes         # Quantization

# Inference
vllm                 # Fast inference
sentence-transformers # Embeddings
chromadb             # Vector store

# Infrastructure
prefect              # Orchestration
wandb                # Experiment tracking
fastapi              # API serving
```

---

## Override Option

Valid reasons to build custom:
- Package doesn't exist for your specific data format
- All available packages are abandoned
- Core differentiator of your data pipeline
- Package has unacceptable performance for your scale
- License incompatibility

Document your reasoning:
```markdown
[x] Override: Building custom [feature] because:
- Searched packages: [list what you checked]
- Why rejected: [specific reason with benchmarks]
- Maintenance plan: [who will maintain this code]
```

---

*Framework Version: 1.0*
*Last Updated: 2025-01-03*
