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
        # Create failure report file
        failure_report = f"DNS Zone Transfer Report for {domain}\n"
        failure_report += "=" * 50 + "\n\n"
        failure_report += f"Command: dig @{domain} AXFR {domain}\n\n"
        failure_report += "Status: FAILED\n"
        failure_report += f"Return Code: {result.returncode}\n"
        failure_report += f"Error Output: {result.stderr}\n"
        failure_report += f"Standard Output: {result.stdout}\n"
        
        result_data = {
            "nodes": [],  # No new nodes
            "files": [{
                "name": f"zone_transfer_failed_{domain}_{int(time.time())}.txt",
                "content": failure_report,
                "type": "text"
            }]
        }
        print(json.dumps(result_data))
except Exception as e:
    # Create error report file
    error_report = f"DNS Zone Transfer Report for {domain}\n"
    error_report += "=" * 50 + "\n\n"
    error_report += f"Command: dig @{domain} AXFR {domain}\n\n"
    error_report += "Status: ERROR\n"
    error_report += f"Error: {str(e)}\n"
    
    result_data = {
        "nodes": [],  # No new nodes
        "files": [{
            "name": f"zone_transfer_error_{domain}_{int(time.time())}.txt",
            "content": error_report,
            "type": "text"
        }]
    }
    print(json.dumps(result_data))