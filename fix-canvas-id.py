with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    '<canvas id="chart-throughput-\\$*{i}"></canvas>',
    '<canvas id="chart-throughput-\\${i}"></canvas>'
)
code = code.replace(
    '<canvas id="chart-latency-\\$*{i}"></canvas>',
    '<canvas id="chart-latency-\\${i}"></canvas>'
)
code = code.replace(
    "\\`.replace(/\\$\\*/g, '');",
    "\\`;"
)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
