with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

bad_block = """                        {!isMinimized && status === 'done' && (\n\n\n                                <button\n\n                                    onClick={handleDownload}"""

good_block = """                        {!isMinimized && status === 'done' && (\n                            <>\n                                <button\n                                    onClick={handleDownload}"""

code = code.replace(bad_block, good_block)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
