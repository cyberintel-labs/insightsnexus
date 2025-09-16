import sys
import json

def text_to_binary(text):
    return [f"{c} = {format(ord(c), '08b')}" for c in text]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("[]")
        sys.exit(0)

    input_text = sys.argv[1]
    results = text_to_binary(input_text)
    print(json.dumps(results))