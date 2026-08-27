with open('apps/web/components/canvas/architecture-canvas.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import for InformationDrawer
import_addition = 'import { InformationDrawer } from "./information-drawer";\nimport { DND_MIME, TechnologyPalette } from "./tech-palette";'
if "InformationDrawer" not in content[:1000]:
    content = content.replace('import { DND_MIME, TechnologyPalette } from "./tech-palette";', import_addition)

# Add infoData state
state_addition = '    const [eventName, setEventName] = useState("");\n    const [infoData, setInfoData] = useState<TechnologyDefinition | ProtocolDefinition | null>(null);'
if "const [infoData" not in content:
    content = content.replace('    const [eventName, setEventName] = useState("");', state_addition)

with open('apps/web/components/canvas/architecture-canvas.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
