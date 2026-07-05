# Source notes: OpenAI Tokenizer tool

Backing source for the Pro Tip link in the **Tokenization** module (`llm:tokens`).

**Source:** [OpenAI Tokenizer](https://platform.openai.com/tokenizer)

## What it is
An interactive web tool where you paste any text and instantly see it broken into color-coded tokens, alongside:
- The token count
- The character count
- Each token's numeric ID (toggle between "Text" and "Token IDs" view)
- Support for both the older GPT-3/GPT-3.5 encoding and the newer GPT-4/GPT-4o (`o200k_base`) encoding

## Why it's useful here
It's the fastest way to build intuition for the panel's core claims before running the hands-on `tiktoken` exercise:
- Common words are usually one token; rare or technical words fragment into several
- Numbers tokenize inconsistently depending on digit grouping
- Punctuation and leading spaces attach to adjacent tokens in non-obvious ways

## Relation to panel content
The panel's hands-on exercise already tells the learner to open this tool ("Open OpenAI's tokenizer visualizer") before running the `tiktoken` code sample. The Pro Tip link makes that a clickable step instead of plain-text instruction.
