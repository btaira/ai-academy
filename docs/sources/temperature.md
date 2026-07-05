# Source notes: Temperature parameter

Backing source for the Pro Tip link in the **Generation Parameters** module (`llm:params`).

**Source:** [Unstructured.io — What Does the Temperature Parameter Mean in LLMs?](https://unstructured.io/insights/what-does-the-temperature-parameter-mean-in-llms)

## Definition
Temperature controls the randomness of generated output by reshaping the probability distribution over possible next tokens before sampling. Lower temperatures make the model favor the most probable tokens; higher temperatures flatten the distribution, increasing the chance of selecting less-probable tokens.

## Recommended ranges

| Use case | Range | Why |
|---|---|---|
| Accuracy-focused (summarization, Q&A, legal/technical documents) | 0.2 – 0.7 | More deterministic, consistent output |
| Creative (brainstorming, content generation, storytelling) | 0.7 – 1.0 | More diverse, novel output |
| Conversational chatbots | 0.5 – 0.7 | Balance of relevance and variability |
| RAG systems | 0.2 – 0.5 | Deterministic, context-grounded responses |

**General guidance:** start around 0.7–1.0 and adjust based on results. Values above 1.0 are generally not recommended — they risk incoherent output. Very low temperatures risk repetitive, overly predictable output.

## Relation to panel content
This confirms and extends the panel's existing guidance ("0 for facts/code/extraction; 0.7-1.0 for creative writing") with task-specific ranges (RAG, customer support vs. entertainment chatbots) worth citing directly in the UI as a Pro Tip link rather than duplicating in full.
