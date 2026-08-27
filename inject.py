with open('apps/web/components/canvas/architecture-canvas.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if 'import { DND_MIME, TechnologyPalette } from "./tech-palette";' in line or "import { DND_MIME, TechnologyPalette } from './tech-palette';" in line:
        new_lines.append(line)
        new_lines.append('import { InformationDrawer } from "./information-drawer";\n')
    elif "const [eventName, setEventName] = useState('');" in line or 'const [eventName, setEventName] = useState("");' in line:
        new_lines.append(line)
        new_lines.append('  const [infoData, setInfoData] = useState<TechnologyDefinition | ProtocolDefinition | null>(null);\n')
    else:
        new_lines.append(line)

with open('apps/web/components/canvas/architecture-canvas.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
