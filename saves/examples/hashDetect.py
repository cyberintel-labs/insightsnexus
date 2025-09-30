import sys, json, re
hash_input = sys.argv[1].strip()
nodes = []

try:
    # Remove common prefixes/suffixes
    clean_hash = re.sub(r'^(md5|sha1|sha256|sha512|ntlm|lm|bcrypt|scrypt|pbkdf2)[:\s]*', '', hash_input.lower())
    clean_hash = re.sub(r'[:\s\-_]+', '', clean_hash)
    
    # Hash length patterns
    hash_patterns = {
        32: ["MD5", "MD4", "MD2", "NTLM", "LM"],
        40: ["SHA1", "RIPEMD-160"],
        56: ["SHA-224"],
        64: ["SHA-256", "SHA3-256", "BLAKE2s-256", "BLAKE2b-256"],
        96: ["SHA-384", "SHA3-384", "BLAKE2b-384"],
        128: ["SHA-512", "SHA3-512", "BLAKE2b-512", "Whirlpool"],
        8: ["CRC32"],
        16: ["CRC64"],
        24: ["DES"],
        48: ["DES-EDE3"],
        60: ["bcrypt"],
        86: ["scrypt"]
    }
    
    # Length-based detection
    hash_length = len(clean_hash)
    possible_types = hash_patterns.get(hash_length, [])
    
    nodes.append(f"Hash Length: {hash_length} characters")
    
    if possible_types:
        # Show the most likely type first
        if hash_length == 32:
            nodes.append("Most Likely: MD5 or NTLM")
        elif hash_length == 40:
            nodes.append("Most Likely: SHA1")
        elif hash_length == 64:
            nodes.append("Most Likely: SHA-256")
        elif hash_length == 128:
            nodes.append("Most Likely: SHA-512")
        elif hash_length == 60:
            nodes.append("Most Likely: bcrypt")
        else:
            nodes.append(f"Most Likely: {possible_types[0]}")
    else:
        nodes.append("Unknown hash type")
    
    if not nodes:
        print(json.dumps({"nodes": [f"Unable to analyze hash: {hash_input}"], "files": []}))
    else:
        print(json.dumps({"nodes": nodes, "files": []}))
    
except Exception as e:
    print(json.dumps({"nodes": [f"Error analyzing hash: {str(e)}"], "files": []}))