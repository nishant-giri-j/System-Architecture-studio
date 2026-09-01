with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

bad = "                                </button>\n\n\n                        )}"
good = "                                </button>\n                            </>\n                        )}"

code = code.replace(bad, good)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
