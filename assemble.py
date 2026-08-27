import json

# Load chunks
with open("chunks/chunk1.json", "r", encoding="utf-8") as f:
    chunk1 = json.load(f)
with open("chunks/chunk2.json", "r", encoding="utf-8") as f:
    chunk2 = json.load(f)
with open("chunks/chunk3.json", "r", encoding="utf-8") as f:
    chunk3 = json.load(f)
with open("chunks/chunk4.json", "r", encoding="utf-8") as f:
    chunk4 = json.load(f)

protocols = {**chunk1, **chunk2}
techs = {**chunk3, **chunk4}

# Write protocol-data.ts
code_prot = """export const generatedProtocolData: Record<string, any> = {\n"""
for k, v in protocols.items():
    code_prot += f'  "{k}": {json.dumps(v)},\n'
code_prot += "};\n"

with open("packages/shared/src/protocol-data.ts", "w", encoding="utf-8") as f:
    f.write(code_prot)
    
# Write tech-data.ts
code_tech = """export const generatedTechData: Record<string, any> = {\n"""
for k, v in techs.items():
    code_tech += f'  "{k}": {json.dumps(v)},\n'
code_tech += "};\n"

with open("packages/shared/src/tech-data.ts", "w", encoding="utf-8") as f:
    f.write(code_tech)
    
print("Assembled all chunks into TS files!")
