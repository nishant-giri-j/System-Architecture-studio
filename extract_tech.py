with open('tech_edits.txt', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find the last EDIT block in the file (since there are multiple replace_file_content calls)
edits = content.split('--- EDIT')
last_edit = edits[-1]

# Extract the technologyLibrary array
start_idx = last_edit.find('export const technologyLibrary: TechnologyDefinition[] = [')
end_idx = last_edit.find('];', start_idx) + 2

tech_lib = last_edit[start_idx:end_idx]

with open('full_tech.ts', 'w', encoding='utf-8') as f:
    f.write(tech_lib)
