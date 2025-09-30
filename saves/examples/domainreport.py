import sys, json, requests, socket, ssl, datetime
domain = sys.argv[1]

# Initialize variables for node creation
resolved_ip = None
ssl_issuer = None
server_header = None

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
            
            # Extract SSL issuer for node creation
            issuer_info = cert.get('issuer', [])
            if issuer_info:
                for item in issuer_info:
                    if isinstance(item, tuple) and len(item) > 0:
                        for subitem in item:
                            if isinstance(subitem, tuple) and len(subitem) == 2:
                                if subitem[0] == 'organizationName':
                                    ssl_issuer = subitem[1]
                                    break
                        if ssl_issuer:
                            break
except Exception as e:
    report_content += f"SSL Certificate Error: {str(e)}\n\n"

# DNS Resolution
try:
    resolved_ip = socket.gethostbyname(domain)
    report_content += f"DNS Resolution: {domain} -> {resolved_ip}\n\n"
except Exception as e:
    report_content += f"DNS Resolution Error: {str(e)}\n\n"

# HTTP Headers Analysis
try:
    response = requests.get(f"https://{domain}", timeout=10, allow_redirects=True)
    report_content += "HTTP Headers Analysis:\n"
    for header, value in response.headers.items():
        if header.lower() in ['server', 'x-powered-by', 'x-frame-options', 'content-security-policy']:
            report_content += f"{header}: {value}\n"
            if header.lower() == 'server':
                server_header = value
    report_content += "\n"
except Exception as e:
    report_content += f"HTTP Analysis Error: {str(e)}\n\n"

# Create nodes for key findings
nodes = []
if resolved_ip:
    nodes.append(f"IP Address: {resolved_ip}")
if ssl_issuer:
    nodes.append(f"SSL Issuer: {ssl_issuer}")
if server_header:
    nodes.append(f"Web Server: {server_header}")

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