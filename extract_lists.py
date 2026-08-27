import re

# Get Techs
with open("packages/shared/src/technology.ts", "r", encoding="utf-8") as f:
    tech_content = f.read()

tech_matches = re.findall(r'id:\s*[\'"]([^\'"]+)[\'"]', tech_content)
print(f"Techs ({len(tech_matches)}):", ", ".join(tech_matches))

# Get Protocols from edge-properties
with open("apps/web/components/canvas/edge-properties.tsx", "r", encoding="utf-8") as f:
    edge_content = f.read()

# Protocol groups format: { label: "...", options: [ "HTTP", "GraphQL", ... ] }
prot_matches = re.findall(r'options:\s*\[([^\]]+)\]', edge_content)
all_prots = []
for m in prot_matches:
    prots = re.findall(r'[\'"]([^\'"]+)[\'"]', m)
    all_prots.extend(prots)

print(f"Protocols ({len(all_prots)}):", ", ".join(all_prots))
