with open('apps/web/components/canvas/architecture-canvas.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
old_str = "className={`absolute top-4 right-4 z-[10000] ${propertiesNodeId || propertiesEdgeId ? 'hidden' : ''}`}"
new_str = "className={`absolute top-4 right-4 z-[10000] ${propertiesNodeId || propertiesEdgeId || infoData ? 'hidden' : ''}`}"
content = content.replace(old_str, new_str)

with open('apps/web/components/canvas/architecture-canvas.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
