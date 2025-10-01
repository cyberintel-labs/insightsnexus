# Custom Transform User Guide

Custom transforms let you extend the investigation graph with your own Python logic. You can upload a Python script that processes any input string and returns results that get integrated into your investigation.

## Security Considerations

Custom transforms execute Python code directly on the server. Only upload scripts you trust completely. In production environments, implement additional security measures such as sandboxing, code validation, and restricted execution environments.

## Quick Start

### 1. Create Your Python Script

Write a Python script that follows this contract:

```python
import sys, json

# Get the input string from command line argument
input_str = sys.argv[1]

# Process the input string (your custom logic here)
result = [f"Processed: {input_str}"]

# Print JSON to stdout
print(json.dumps(result))
```

**Requirements:**
- Accept one command-line argument via `sys.argv[1]`
- Print valid JSON to stdout
- Have a `.py` extension

### 2. Upload Your Script

1. Go to the application toolbar and click "Tools" → "Upload Transform"
2. Select your `.py` file in the file picker dialog
3. Click "Open" to upload

The button text changes to "Remove Transform" upon successful upload.

### 3. Execute Your Transform

Right-click any node in your investigation graph, select Transforms, then select "Run Custom Transform" from the context menu. Your script executes with the node's data as input, and results appear as new nodes connected to the original.

## Output Formats

Your script can output JSON in two formats:

### Array Format (Simple Nodes Only)
```json
["result1", "result2", "result3"]
```

### Object Format (With File Support)
```json
{
  "nodes": ["result1", "result2", "result3"],
  "files": [
    {
      "name": "report.txt",
      "content": "file content here",
      "type": "text"
    }
  ]
}
```

**File Object Properties:**
- `name`: The filename
- `content`: File content (plain text for text files, base64 data URL for images)
- `type`: Either "text" or "image"

## Example Scripts

Reference implementations are available in the project's `saves/examples/` directory:

- **`dnsTransfer.py`** - DNS zone transfer attempt with file upload
- **`hashDetect.py`** - Hash type detection with node creation
- **`domainreport.py`** - Comprehensive domain analysis with both nodes and files

These examples demonstrate different transform patterns and output formats.

## System Behavior

- **Single Active Transform**: Only one custom transform can be active at a time. Uploading a new script automatically replaces the previous one.
- **Storage**: Scripts are stored as `customTransform.py` in the `saves/` directory.
- **Execution**: Scripts are executed using `python3 "path/to/customTransform.py" "input_string"`.
- **Input**: Node data is passed as a command-line argument to your script.

## Management

### Removing Your Transform

To remove your custom transform:
1. Click "Tools" in the toolbar
2. Select "Remove Transform"
3. The script is deleted from the server and the button reverts to "Upload Transform"

### Error Handling

- **Invalid JSON**: If your script outputs invalid JSON, the transform fails
- **Python Errors**: Execution errors are logged to the console
- **File Upload Errors**: Display alert messages to the user

## Advanced Patterns

### Multiple Results
Return multiple results to create multiple connected nodes:
```python
import sys, json
input_str = sys.argv[1]
nodes = [f"Result {i}: {item}" for i, item in enumerate(process_input(input_str))]
print(json.dumps({"nodes": nodes, "files": []}))
```

### File Generation
Create and upload files with your transform results:
```python
import sys, json
input_str = sys.argv[1]

# Generate report content
report = f"Analysis Report for: {input_str}\n"
report += f"Timestamp: {datetime.now()}\n"
report += f"Length: {len(input_str)}\n"

result = {
    "nodes": [f"Analyzed: {input_str}"],
    "files": [{
        "name": "analysis_report.txt",
        "content": report,
        "type": "text"
    }]
}
print(json.dumps(result))
```

### Image Upload
Upload images using base64 data URLs:
```python
import sys, json, base64

# Generate or load image data
image_data = generate_image_data(input_str)

result = {
    "nodes": [f"Generated image for: {input_str}"],
    "files": [{
        "name": "output.png",
        "content": f"data:image/png;base64,{image_data}",
        "type": "image"
    }]
}
print(json.dumps(result))
```