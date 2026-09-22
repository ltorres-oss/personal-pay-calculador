import sys, base64

if len(sys.argv) < 3:
    print('Usage: python write_file.py <path> <b64_content>')
    sys.exit(1)

path = sys.argv[1]
b64_content = sys.argv[2]
content = base64.b64decode(b64_content.encode('utf-8'))

with open(path, 'wb') as f:
    f.write(content)
print(f'Wrote {len(content)} bytes to {path}')
