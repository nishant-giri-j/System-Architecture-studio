with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import re
old_code = """const HistoryCharts = React.memo(({ items, nodes }: { items: any[], nodes: any[] }) => {

    return (

        {/* All Historical and Current Charts */}

                                <div className="mb-6 flex flex-col gap-12 shrink-0 w-full">"""

new_code = """const HistoryCharts = React.memo(({ items, nodes }: { items: any[], nodes: any[] }) => {

    return (
                                <div className="mb-6 flex flex-col gap-12 shrink-0 w-full">
                                    {/* All Historical and Current Charts */}"""

code = code.replace(old_code, new_code)
with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
