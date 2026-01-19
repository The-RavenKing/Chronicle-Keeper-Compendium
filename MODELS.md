# Ollama Model Recommendations

This guide helps you choose the right Ollama model for the Race Importer.

## Quick Recommendations

| Use Case | Recommended Model | Command |
|----------|------------------|---------|
| **Best Overall** | Llama 3.1 (8B) | `ollama run llama3.1` |
| **Fastest** | Llama 3.2 (3B) | `ollama run llama3.2` |
| **Most Accurate** | Qwen2.5 (14B) | `ollama run qwen2.5:14b` |
| **Low Memory** | Phi-3 (3B) | `ollama run phi3` |
| **Balanced** | Mistral (7B) | `ollama run mistral` |

## Model Comparison

### Llama 3.1 (8B) ⭐ Recommended
- **Size**: ~4.7 GB
- **RAM Required**: 8 GB
- **Speed**: Fast
- **Accuracy**: Excellent
- **Best for**: General use, good balance

```bash
ollama run llama3.1
```

### Llama 3.2 (3B)
- **Size**: ~2 GB
- **RAM Required**: 4 GB
- **Speed**: Very Fast
- **Accuracy**: Good
- **Best for**: Quick imports, low-resource systems

```bash
ollama run llama3.2
```

### Qwen2.5 (14B)
- **Size**: ~9 GB
- **RAM Required**: 16 GB
- **Speed**: Slower
- **Accuracy**: Excellent
- **Best for**: Complex homebrew, detailed parsing

```bash
ollama run qwen2.5:14b
```

### Mistral (7B)
- **Size**: ~4.1 GB
- **RAM Required**: 8 GB
- **Speed**: Fast
- **Accuracy**: Very Good
- **Best for**: Reliable imports, good alternative to Llama

```bash
ollama run mistral
```

### Phi-3 Mini (3.8B)
- **Size**: ~2.3 GB
- **RAM Required**: 4 GB
- **Speed**: Very Fast
- **Accuracy**: Good
- **Best for**: Laptops, older systems

```bash
ollama run phi3
```

### Gemma 2 (9B)
- **Size**: ~5.5 GB
- **RAM Required**: 10 GB
- **Speed**: Medium
- **Accuracy**: Very Good
- **Best for**: Google ecosystem users

```bash
ollama run gemma2:9b
```

## Performance Characteristics

### Speed Ranking (Fastest to Slowest)
1. Llama 3.2 (3B)
2. Phi-3 (3.8B)
3. Mistral (7B)
4. Llama 3.1 (8B)
5. Gemma 2 (9B)
6. Qwen2.5 (14B)

### Accuracy Ranking (Most to Least Accurate)
1. Qwen2.5 (14B)
2. Llama 3.1 (8B)
3. Gemma 2 (9B)
4. Mistral (7B)
5. Phi-3 (3.8B)
6. Llama 3.2 (3B)

### Memory Usage Ranking (Lowest to Highest)
1. Llama 3.2 (3B) - 4 GB RAM
2. Phi-3 (3.8B) - 4 GB RAM
3. Mistral (7B) - 8 GB RAM
4. Llama 3.1 (8B) - 8 GB RAM
5. Gemma 2 (9B) - 10 GB RAM
6. Qwen2.5 (14B) - 16 GB RAM

## System Requirements

### Minimum System (Budget Gaming PC / Modern Laptop)
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 10 GB free
- **Recommended Model**: Llama 3.1 (8B) or Mistral (7B)

### Low-End System (Older Laptop)
- **CPU**: 2-4 cores
- **RAM**: 4-8 GB
- **Storage**: 5 GB free
- **Recommended Model**: Llama 3.2 (3B) or Phi-3

### High-End System (Gaming PC / Workstation)
- **CPU**: 6+ cores
- **RAM**: 16+ GB
- **Storage**: 20 GB free
- **Recommended Model**: Qwen2.5 (14B)

## Installation Commands

### Install Multiple Models (Recommended)

Install a fast model and an accurate model:

```bash
# Fast model for quick imports
ollama run llama3.2

# Accurate model for complex content
ollama run llama3.1
```

### List Installed Models

```bash
ollama list
```

### Remove a Model

```bash
ollama rm llama3.2
```

### Update a Model

```bash
ollama pull llama3.1
```

## Choosing the Right Model

### For Standard D&D/Pathfinder Races
**Use**: Llama 3.1 (8B) or Mistral (7B)
- Official content is well-structured
- These models handle it perfectly
- Good speed/accuracy balance

### For Homebrew Content
**Use**: Qwen2.5 (14B) or Llama 3.1 (8B)
- Homebrew can be inconsistent
- Better models handle variation well
- Worth the extra processing time

### For Batch Importing
**Use**: Llama 3.2 (3B) or Phi-3
- Speed matters when importing many races
- Official content doesn't need heavy models
- Can always edit details later

### For Complex/Unusual Races
**Use**: Qwen2.5 (14B)
- Best at understanding context
- Handles unusual formatting
- Most accurate extraction

## Model Settings in Module

In the Race Importer settings:

1. **Ollama URL**: Leave as `http://localhost:11434`
2. **Ollama Model**: Enter just the model name:
   - `llama3.1`
   - `mistral`
   - `qwen2.5:14b`
   - etc.

## Testing Different Models

Try importing the same race with different models:

```bash
# Install models
ollama run llama3.2
ollama run llama3.1
ollama run mistral

# Test each one:
# 1. Import with llama3.2 (fast)
# 2. Import with llama3.1 (balanced)
# 3. Import with mistral (accurate)

# Compare results
```

## Troubleshooting

### Model Too Slow
- Try a smaller model (3B-7B range)
- Close other applications
- Ensure Ollama is using CPU properly

### Not Accurate Enough
- Use a larger model (14B+)
- Provide cleaner/more detailed input
- Check that model name is correct in settings

### Out of Memory
- Use smaller model
- Close other applications
- Restart Ollama: `ollama serve`

### Model Not Found
```bash
# Make sure it's installed
ollama list

# If not listed, install it
ollama run llama3.1
```

## Advanced: Model Variants

Some models have variants:

```bash
# Standard (8B)
ollama run llama3.1

# Smaller (1B - very fast, less accurate)
ollama run llama3.2:1b

# Larger (70B - very accurate, very slow)
ollama run llama3.1:70b

# Quantized (faster, slightly less accurate)
ollama run llama3.1:8b-q4
```

For Race Importer, stick with standard models unless you have specific needs.

## Recommendations Summary

**Most Users**: Llama 3.1 (8B)
```bash
ollama run llama3.1
```

**Low Memory**: Llama 3.2 (3B)
```bash
ollama run llama3.2
```

**Maximum Accuracy**: Qwen2.5 (14B)
```bash
ollama run qwen2.5:14b
```

**Best Alternative**: Mistral (7B)
```bash
ollama run mistral
```

---

Pick one, install it, and start importing! You can always try different models later.
