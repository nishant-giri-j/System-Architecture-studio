import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Fix the HTML CDN to include typography plugin
code = code.replace('<script src="https://cdn.tailwindcss.com"></script>', 
                    '<script src="https://cdn.tailwindcss.com?plugins=typography"></script>')

# 2. Fix the intermediate analysis styling
# Old: <div className="prose prose-sm max-w-none font-medium">
new_markdown_classes = 'text-black font-medium leading-relaxed [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:uppercase [&_h2]:text-xl [&_h2]:font-black [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:uppercase [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-1 [&_strong]:font-black [&_strong]:bg-[#ffde59] [&_strong]:px-1'
code = code.replace('<div className="prose prose-sm max-w-none font-medium">', 
                    f'<div className="{new_markdown_classes}">')

# 3. Fix the final conclusion styling
# Old: <div className="prose prose-sm md:prose-base max-w-none text-black prose-headings:font-black prose-headings:uppercase prose-strong:font-black prose-a:text-[#5de2e7] prose-li:font-bold prose-p:font-bold prose-headings:border-b-2 prose-headings:border-[#161616] prose-headings:pb-2">
old_conclusion_classes = '<div className="prose prose-sm md:prose-base max-w-none text-black prose-headings:font-black prose-headings:uppercase prose-strong:font-black prose-a:text-[#5de2e7] prose-li:font-bold prose-p:font-bold prose-headings:border-b-2 prose-headings:border-[#161616] prose-headings:pb-2">'
new_conclusion_classes = f'<div className="{new_markdown_classes} text-lg">'
code = code.replace(old_conclusion_classes, new_conclusion_classes)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
