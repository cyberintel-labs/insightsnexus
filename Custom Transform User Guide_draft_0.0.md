# Custom Transform User Guide

Custom transforms let you extend the investigation graph with your own Python logic. You can upload a Python script that processes any input string and returns results that get integrated into your investigation.

## Security Considerations

Custom transforms execute Python code directly on the server, so only upload scripts you trust completely. In production environments, you should implement additional security measures.

## Step-by-Step Process

### Create Your Python Script

Write a Python script that follows this contract:

```python
import sys, json

# Get the input string from command line argument
input_str = sys.argv[1]

# Process the input string (your custom logic here)
# Example: convert characters to binary representation
result = [f"{ch} = {bin(ord(ch))[2:].zfill(8)}" for ch in input_str]

# Print JSON array to stdout
print(json.dumps(result))
```

Your script needs to accept one command-line argument via `sys.argv[1]`, print a JSON array to stdout, and have a `.py` extension.

### Upload Your Script

First, go to the application toolbar and click "Tools", then "Upload Transform". A file picker dialog will open where you can navigate to and select your `.py` file. Click "Open" to upload it.

Once uploaded, the file gets saved to the server, the button text changes to "Remove Transform", and you'll see a success message in the console.

### Use Your Custom Transform

Right-click on any node in your investigation graph and select "Run Custom Transform" from the context menu. Your script will execute with the node's data as input, and the results will appear as new nodes connected to the original.

## Examples

Here are some examples organized by their behavior on the graph:

### File Upload Only (No New Nodes)

These transforms upload files to the originating node without creating new nodes:

**DNS Zone Transfer Attempt**

This script attempts a DNS zone transfer and uploads the results as a file to the originating node:
```python
import sys, json, subprocess, os, time
domain = sys.argv[1]
try:
    # Attempt zone transfer using dig
    result = subprocess.run(['dig', f'@{domain}', 'AXFR', domain], 
                          capture_output=True, text=True, timeout=30)
    
    if result.returncode == 0 and result.stdout:
        # Create zone transfer report
        report = f"DNS Zone Transfer Report for {domain}\n"
        report += "=" * 50 + "\n\n"
        report += f"Command: dig @{domain} AXFR {domain}\n\n"
        report += "Results:\n"
        report += result.stdout
        
        # Return new format with file
        result_data = {
            "nodes": [],  # No new nodes
            "files": [{
                "name": f"zone_transfer_{domain}_{int(time.time())}.txt",
                "content": report,
                "type": "text"
            }]
        }
        print(json.dumps(result_data))
    else:
        print(json.dumps({"nodes": [f"Zone transfer failed for {domain}"], "files": []}))
except Exception as e:
    print(json.dumps({"nodes": [f"Error: {str(e)}"], "files": []}))
```

### New Nodes Only (No File Upload)

These transforms create new nodes in the graph without uploading files:

**Breach Database Lookup**

Search for email addresses in known data breaches and create new nodes for each breach found:
```python
import sys, json, requests
email = sys.argv[1]
try:
    # Query Have I Been Pwned API (free tier)
    url = f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}"
    headers = {"hibp-api-key": "your-api-key-here"}  # Add your API key
    
    response = requests.get(url, headers=headers, timeout=10)
    
    if response.status_code == 200:
        breaches = response.json()
        nodes = [f"Breach: {breach['Name']} ({breach['BreachDate']})" for breach in breaches]
        print(json.dumps({"nodes": nodes, "files": []}))
    elif response.status_code == 404:
        print(json.dumps({"nodes": [f"No breaches found for {email}"], "files": []}))
    else:
        print(json.dumps({"nodes": [f"API error: {response.status_code}"], "files": []}))
except Exception as e:
    print(json.dumps({"nodes": [f"Error checking breaches: {str(e)}"], "files": []}))
```

### Both New Nodes and File Upload

These transforms create new nodes AND upload files to the originating node:

**Domain Intelligence Report**

Comprehensive domain analysis that creates new nodes AND uploads detailed reports:
```python
import sys, json, requests, socket, ssl, datetime
domain = sys.argv[1]

# Create comprehensive report
report_content = f"Domain Intelligence Report for {domain}\n"
report_content += "=" * 50 + "\n\n"

# SSL Certificate Information
try:
    context = ssl.create_default_context()
    with socket.create_connection((domain, 443), timeout=10) as sock:
        with context.wrap_socket(sock, server_hostname=domain) as ssock:
            cert = ssock.getpeercert()
            report_content += "SSL Certificate Details:\n"
            report_content += f"Subject: {cert.get('subject', 'N/A')}\n"
            report_content += f"Issuer: {cert.get('issuer', 'N/A')}\n"
            report_content += f"Valid From: {cert.get('notBefore', 'N/A')}\n"
            report_content += f"Valid Until: {cert.get('notAfter', 'N/A')}\n\n"
except Exception as e:
    report_content += f"SSL Certificate Error: {str(e)}\n\n"

# DNS Resolution
try:
    ip = socket.gethostbyname(domain)
    report_content += f"DNS Resolution: {domain} -> {ip}\n\n"
except Exception as e:
    report_content += f"DNS Resolution Error: {str(e)}\n\n"

# HTTP Headers Analysis
try:
    response = requests.get(f"https://{domain}", timeout=10, allow_redirects=True)
    report_content += "HTTP Headers Analysis:\n"
    for header, value in response.headers.items():
        if header.lower() in ['server', 'x-powered-by', 'x-frame-options', 'content-security-policy']:
            report_content += f"{header}: {value}\n"
    report_content += "\n"
except Exception as e:
    report_content += f"HTTP Analysis Error: {str(e)}\n\n"

# Create nodes for key findings
nodes = []
if 'ip' in locals():
    nodes.append(f"IP Address: {ip}")
if 'cert' in locals():
    issuer = cert.get('issuer', [])
    if issuer:
        for item in issuer:
            if item[0][0] == 'organizationName':
                nodes.append(f"SSL Issuer: {item[0][1]}")
                break

# Add timestamp to report
report_content += f"Report Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"

# Return new format with nodes and file
result_data = {
    "nodes": nodes,
    "files": [{
        "name": f"domain_intel_{domain}_{int(datetime.datetime.now().timestamp())}.txt",
        "content": report_content,
        "type": "text"
    }]
}
print(json.dumps(result_data))
```

**IP Range Expander**

Expand CIDR blocks into individual IP addresses:
```python
import sys, json, ipaddress
cidr = sys.argv[1]
try:
    network = ipaddress.ip_network(cidr, strict=False)
    ips = [str(ip) for ip in network.hosts()]
    nodes = [f"IP: {ip}" for ip in ips[:50]]  # Limit to 50 IPs
    print(json.dumps({"nodes": nodes, "files": []}))
except:
    print(json.dumps({"nodes": [f"Error: Invalid CIDR block {cidr}"], "files": []}))
```

**Hash Generator**

Generate multiple hash types for data verification:
```python
import sys, json, hashlib
input_str = sys.argv[1]
md5_hash = hashlib.md5(input_str.encode()).hexdigest()
sha1_hash = hashlib.sha1(input_str.encode()).hexdigest()
sha256_hash = hashlib.sha256(input_str.encode()).hexdigest()
nodes = [f"MD5: {md5_hash}", f"SHA1: {sha1_hash}", f"SHA256: {sha256_hash}"]
print(json.dumps({"nodes": nodes, "files": []}))
```

## Important Notes

### System Behavior

Only one custom transform can be active at a time. When you upload a new script, it automatically replaces the previous one. The script gets stored as `customTransform.py` in the saves directory and is executed using `python3 "path/to/customTransform.py" "input_string"`.

### How to Remove Your Transform

To remove your custom transform, click "Tools" in the toolbar, then "Remove Transform". The script gets deleted from the server and the button reverts back to "Upload Transform".

### Input/Output Format

The node's data gets passed as a command-line argument to your script. Your script can output JSON in two formats:

**Legacy Format (backward compatible):**
```json
["result1", "result2", "result3"]
```

**New Format (with file support):**
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

The `files` array is optional. Each file entry should include:
- `name`: The filename
- `content`: The file content (plain text for text files, base64 data URL for images)
- `type`: Either "text" or "image"

### Error Handling

If your script outputs invalid JSON, the transform will fail. Python execution errors get logged to the console, and file upload errors show an alert message.

## Advanced Usage

### Multiple Results

You can return multiple results to create multiple connected nodes:
```python
import sys, json
input_str = sys.argv[1]
nodes = []
for i, char in enumerate(input_str):
    nodes.append(f"Character {i}: {char} (ASCII: {ord(char)})")
print(json.dumps({"nodes": nodes, "files": []}))
```

### File Upload Examples

**Text File Upload:**
```python
import sys, json
input_str = sys.argv[1]
report = f"Analysis of: {input_str}\n"
report += f"Length: {len(input_str)}\n"
report += f"Characters: {list(input_str)}\n"

result = {
    "nodes": [f"Analyzed: {input_str}"],
    "files": [{
        "name": "analysis.txt",
        "content": report,
        "type": "text"
    }]
}
print(json.dumps(result))
```

**Image File Upload (Base64):**
```python
import sys, json, base64
input_str = sys.argv[1]

# Example: Create a simple text-based "image" as base64
# In practice, you'd generate or load an actual image
image_data = base64.b64encode(f"Image for: {input_str}".encode()).decode()

result = {
    "nodes": [f"Generated image for: {input_str}"],
    "files": [{
        "name": "generated_image.png",
        "content": f"data:image/png;base64,{image_data}",
        "type": "image"
    }]
}
print(json.dumps(result))
```