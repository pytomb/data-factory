# Data Scarcity Score Framework

> **The Goal**: Find domains where fine-tuning delivers REAL value—not domains where prompting alone works fine.

---

## The Core Problem

Most fine-tuning projects fail because they train for **convenience** rather than **necessity**.

- **Convenience fine-tuning**: "It would be nice if the model knew about X"
- **Necessary fine-tuning**: "Base models fail at X because the knowledge doesn't exist in their training data"

The difference isn't subtle—it's the difference between wasting GPU credits on a model that performs the same as prompting, and building a genuinely valuable specialized model.

---

## The Prompting Test

Before fine-tuning, ask: "Can a well-prompted base model do this?"

If the answer is "yes, pretty much," you don't need to fine-tune—you need better prompts.

**Real fine-tuning needs look different.** They involve:
- Knowledge that doesn't exist in base model training data
- Specialized terminology or formats
- Domain-specific reasoning patterns
- Local/cultural context base models miss
- Proprietary information or processes

---

## The "Not-In-Training-Data" Criterion

The ultimate test of fine-tuning necessity:

> **Is this knowledge absent from the base model's training data?**

If the base model could reasonably have learned this from the internet, you probably don't need fine-tuning—you need better prompting.

### Signs of Genuine Data Scarcity:
- Base model confidently gives wrong answers in this domain
- Correct answers require unpublished or proprietary knowledge
- The domain uses specialized terminology/formats not in general text
- Local context (regional, cultural, organizational) is essential
- The knowledge is too recent for training cutoffs

### Signs of Pseudo-Scarcity:
- "The model doesn't know about our product" (it can learn from prompts)
- "We want it to sound like us" (style transfer, not knowledge gap)
- "It should always respond in X format" (system prompts handle this)
- "We need it to be an expert in Y" (if Y is documented online, base model knows it)

---

## Evidence Quality Hierarchy

Not all training data signals are equal. Rank by value:

### Tier 1: Exclusive Knowledge (Highest Value)
- Proprietary processes, methodologies, or frameworks
- Undocumented expert knowledge ("tribal knowledge")
- Internal documents not available publicly
- Licensed content with redistribution rights
- Original research or collected data

### Tier 2: Scarce Knowledge (High Value)
- Specialized textbooks not digitized
- Domain expert interviews and recordings
- Regional/cultural knowledge underrepresented online
- Historical documents not in common corpora
- Professional practice patterns

### Tier 3: Underrepresented Knowledge (Medium Value)
- Topics with limited online presence
- Languages/dialects with fewer web resources
- Niche industry practices
- Specialized formats or conventions
- Recent developments (post training-cutoff)

### Tier 4: Available But Scattered (Low Value)
- Information exists online but dispersed
- Would require extensive prompting to cover
- Base model knows pieces but not integration
- Specific style or tone preferences

### Tier 5: Readily Available (No Value)
- Well-documented topics with extensive online presence
- Common knowledge in base model training
- Popular frameworks and methodologies
- General domain expertise

**Rule**: Never proceed with fine-tuning on Tier 4-5 evidence alone. You'll waste resources recreating what prompting can achieve.

---

## The Data Scarcity Rubric

Score each category 0-4. Maximum score: 40.

### 1. Knowledge Exclusivity (0-4)
*How unique is this knowledge to your sources?*

| Score | Description |
|-------|-------------|
| 0 | Widely available online, base model knows it |
| 1 | Available but scattered, requires extensive prompting |
| 2 | Underrepresented in online sources |
| 3 | Rare—only in specialized texts or expert knowledge |
| 4 | Exclusive—proprietary, undocumented, or original data |

### 2. Base Model Failure Rate (0-4)
*How badly does the base model fail at this?*

| Score | Description |
|-------|-------------|
| 0 | Base model handles it correctly with good prompts |
| 1 | Base model mostly correct, occasional errors |
| 2 | Base model has significant gaps but usable |
| 3 | Base model frequently wrong or hallucinates |
| 4 | Base model completely fails or refuses the domain |

### 3. Local Context Requirement (0-4)
*How much does success depend on local/specific context?*

| Score | Description |
|-------|-------------|
| 0 | Generic knowledge works fine |
| 1 | Minor regional/cultural adjustments needed |
| 2 | Moderate localization required |
| 3 | Heavy local context (terminology, customs, systems) |
| 4 | Domain is entirely local (language, regulations, practices) |

### 4. Terminology Specificity (0-4)
*How specialized is the required vocabulary?*

| Score | Description |
|-------|-------------|
| 0 | General vocabulary sufficient |
| 1 | Some domain terms, easily explained |
| 2 | Moderate specialized vocabulary |
| 3 | Heavy jargon, acronyms, or technical terms |
| 4 | Unique terminology, neologisms, or coded language |

### 5. Format/Structure Requirements (0-4)
*How specific are the output format needs?*

| Score | Description |
|-------|-------------|
| 0 | Standard text responses work |
| 1 | Minor formatting preferences |
| 2 | Specific template or structure required |
| 3 | Complex domain-specific format |
| 4 | Unique format that requires training to produce |

### 6. Reasoning Pattern Complexity (0-4)
*How specialized is the required reasoning?*

| Score | Description |
|-------|-------------|
| 0 | General reasoning sufficient |
| 1 | Standard domain reasoning patterns |
| 2 | Some specialized decision trees |
| 3 | Complex domain-specific logic |
| 4 | Novel reasoning patterns not in base models |

### 7. Accuracy Stakes (0-4)
*How critical is domain accuracy?*

| Score | Description |
|-------|-------------|
| 0 | Errors have minimal impact |
| 1 | Errors cause inconvenience |
| 2 | Errors cause moderate harm or cost |
| 3 | Errors cause significant harm (health, financial) |
| 4 | Errors are catastrophic (safety-critical domains) |

### 8. Data Quality Potential (0-4)
*How good can your training data be?*

| Score | Description |
|-------|-------------|
| 0 | Poor quality, noisy, or unreliable sources |
| 1 | Mediocre data, significant cleaning needed |
| 2 | Decent data from credible sources |
| 3 | High-quality expert-vetted content |
| 4 | Exceptional data with expert annotation |

### 9. Evaluation Feasibility (0-4)
*Can you measure if fine-tuning worked?*

| Score | Description |
|-------|-------------|
| 0 | No clear way to evaluate success |
| 1 | Subjective evaluation only |
| 2 | Some objective metrics possible |
| 3 | Clear benchmarks exist or can be created |
| 4 | Rigorous domain-specific evaluation framework |

### 10. Deployment Viability (0-4)
*Can the trained model actually be used?*

| Score | Description |
|-------|-------------|
| 0 | No clear deployment path |
| 1 | Deployment possible but challenging |
| 2 | Standard deployment with some constraints |
| 3 | Clear deployment path, moderate resources |
| 4 | Easy deployment, fits target hardware perfectly |

---

## Score Interpretation

| Score Range | Assessment | Recommendation |
|-------------|------------|----------------|
| **0-16** | Prompting Zone | Do NOT fine-tune. Use better prompts, RAG, or few-shot examples instead. |
| **17-26** | Gray Zone | Fine-tuning MIGHT help. Run baseline comparison first. Consider hybrid approaches. |
| **27-34** | Strong Case | Good candidate for fine-tuning. Proceed with clear evaluation plan. |
| **35-40** | Clear Win | Exceptional opportunity. Fine-tuning will provide significant value. |

### Override Option

The gate is a guardrail, not a prison. If you have valid reasons to proceed despite a low score:

```markdown
[x] Fine-tune anyway
```
or
```markdown
✅ OVERRIDE: [Your reasoning here]
```

**Valid reasons to override:**
- Learning exercise / research project
- Proof of concept for stakeholders
- Testing fine-tuning pipeline
- Strategic bet on emerging domain
- Internal tool where costs don't matter

**Not valid reasons:**
- "Fine-tuning sounds more impressive than prompting"
- "We already collected the data"
- "We have GPU credits to burn"
- "Competitors are fine-tuning"

---

## Score Interpretation Guidelines

**0-16 (Prompting Zone)**
- The base model can handle this with proper prompting
- You're seeking convenience, not necessity
- Common failure mode: "But our data is special" (it usually isn't)
- Action: Use system prompts, RAG, or few-shot examples instead

**17-26 (Gray Zone)**
- There's something here, but ROI is uncertain
- May benefit from fine-tuning OR better prompting
- Test both approaches before committing
- Action: Run baseline eval, compare prompted vs fine-tuned

**27-34 (Strong Case)**
- Real knowledge gap, real improvement potential
- Clear evaluation path exists
- Data quality can support training
- Action: Proceed with rigorous baseline → fine-tune → evaluate cycle

**35-40 (Clear Win)**
- Rare and valuable opportunity
- Base model genuinely cannot do this
- High-quality data available
- Action: Prioritize this project, allocate resources

---

## Discovery Questions

### Instead of asking "Should we fine-tune?", ask:

**Wrong**: "Would fine-tuning help with our use case?"
**Right**: "Can a well-prompted base model handle this use case?"

**Wrong**: "What data should we collect for training?"
**Right**: "What knowledge is missing from base model training data?"

**Wrong**: "How many examples do we need?"
**Right**: "What specific capability gap are we trying to fill?"

### Data Source Evaluation Questions:

- "Is this knowledge available anywhere online?"
- "Does the base model already know this if prompted correctly?"
- "What makes our domain different from what's in training data?"
- "How will we know if fine-tuning actually helped?"
- "What's our fallback if fine-tuning doesn't improve performance?"

---

## The Base Model Comparison Test

Before any fine-tuning project, you MUST establish baselines:

### Step 1: Zero-Shot Baseline
Test base model with no special prompting on domain tasks.
- Record accuracy, quality, failure modes
- Note where it succeeds and fails

### Step 2: Few-Shot Baseline
Test base model with examples in the prompt.
- Include 3-5 domain examples
- Record improvement over zero-shot

### Step 3: Prompted Baseline
Test base model with optimized system prompt.
- Include domain context, terminology, format requirements
- This is your comparison target

### Step 4: RAG Baseline (Optional)
Test base model with retrieval augmentation.
- Add relevant documents to context
- Measure if retrieval solves the problem

**Fine-tuning is only justified if it beats the prompted baseline by a meaningful margin.**

Define "meaningful margin" before you start:
- 10% improvement? Not worth the effort.
- 30% improvement? Worth considering.
- 50%+ improvement? Clear win.

---

## Integration with Data Factory Workflow

### When to Apply This Framework:

| Phase | Application |
|-------|-------------|
| **Discovery (intake)** | Initial scarcity hypothesis |
| **Discovery (sources)** | Source quality scoring |
| **Discovery (ethics)** | Data rights and exclusivity verification |
| **Collection (validate)** | Confirm data meets scarcity criteria |
| **Training (baseline)** | Establish prompted baseline before training |
| **Training (evaluate)** | Verify fine-tuning beat baseline meaningfully |

### Gate Integration

The `data-scope-defined` gate should verify:
- Data Scarcity Score calculated (minimum 20/40)
- Baseline evaluation plan defined
- Success criteria established before training

### Red Flags to Watch For:

- Fine-tuning because you have data (sunk cost fallacy)
- Skipping baseline comparison (confirmation bias)
- "The base model doesn't know our product" (prompting solves this)
- Collecting data before proving scarcity (premature optimization)
- No clear evaluation plan (unmeasurable goals)

### Green Flags That Validate Scarcity:

- Base model confidently wrong in domain evaluations
- Domain experts confirm knowledge not publicly available
- Language/dialect underrepresented in training data
- Proprietary processes with documented success
- Post-training-cutoff information essential to task

---

## Summary: The Data Scarcity Mindset

1. **Scarcity is about training data, not convenience** — Fine-tune when knowledge is missing, not when prompting is tedious
2. **Baseline first, always** — Never fine-tune without comparing to prompted baseline
3. **Evidence has tiers** — Require high-quality scarcity evidence before training
4. **Evaluation is required** — If you can't measure improvement, you can't justify fine-tuning
5. **Prompting is often enough** — Most "fine-tuning needs" are really prompting needs
6. **The Scarcity Score is your filter** — 27+ to proceed, 17-26 requires deeper investigation

---

## Quick Reference Card

### Before Fine-Tuning, Verify:
- [ ] Base model genuinely fails at this task (not just inconvenient)
- [ ] Knowledge is absent from base model training data
- [ ] Prompted baseline established and documented
- [ ] Training data is Tier 1-3 quality (exclusive, scarce, or underrepresented)
- [ ] Clear evaluation metrics defined
- [ ] Data Scarcity Score is 27+ (or justified override)

### Questions to Always Ask:
1. "Can a well-prompted base model do this?"
2. "What specific knowledge is missing?"
3. "How will we measure improvement?"
4. "What's the prompted baseline performance?"
5. "What tier is our training data?"

---

*Framework Version: 1.0*
*Last Updated: 2025-01-08*
*Based on: MVP Factory Authentic Demand Framework, practical fine-tuning experience*
