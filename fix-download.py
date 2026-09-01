# coding=utf-8
import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_download = """    const handleDownload = () => {
        if (!conclusion || !plan) return;
        let md = `# AI Parameter Sweep: ${plan.targetField}\\n\\n`;
        md += `**Target Node**: ${plan.targetNodeId}\\n`;
        md += `**Hypothesis**: ${plan.hypothesis}\\n\\n`;
        md += `## Results\\n\\n| Value | Avg Latency | Throughput/s | Errors |\\n|---|---|---|---|\\n`;
        results.forEach(r => {
            md += `| ${r.value} | ${r.avgLatency.toFixed(2)}ms | ${r.throughput.toFixed(2)} | ${r.errors} |\\n`;
        });
        md += `\\n## AI Analysis\\n\\n${conclusion}`;
        
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `experiment-${plan.targetNodeId}-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };"""

new_download = """    const handleDownload = () => {
        if (!conclusion || history.length === 0) return;
        
        let md = `# AI Chaos Engineering Report\\n\\n`;
        
        history.forEach((h, i) => {
            md += `## Experiment ${i + 1}: ${h.plan.targetField} on ${h.plan.targetNodeId}\\n\\n`;
            md += `**Hypothesis**: *${h.plan.hypothesis}*\\n\\n`;
            
            md += `### Data Table\\n\\n`;
            md += `| Step | Value | Avg Latency (ms) | Throughput (req/s) | Errors |\\n`;
            md += `|---|---|---|---|---|\\n`;
            h.results.forEach((r: any, idx: number) => {
                md += `| ${idx + 1} | ${r.value} | ${r.avgLatency.toFixed(2)} | ${r.throughput.toFixed(2)} | ${r.errors} |\\n`;
            });
            
            // Generate an ASCII bar chart for Latency
            md += `\\n### Latency Graph (ASCII)\\n\\n`;
            md += "```text\\n";
            const maxLat = Math.max(...h.results.map((r: any) => r.avgLatency), 1);
            h.results.forEach((r: any) => {
                const barLen = Math.max(1, Math.round((r.avgLatency / maxLat) * 40));
                const bar = "\\u2588".repeat(barLen);
                md += `Val ${r.value.toString().padEnd(5)} | ${bar} ${r.avgLatency.toFixed(1)}ms\\n`;
            });
            md += "```\\n\\n";
            
            // Generate an ASCII bar chart for Errors
            md += `### Errors Graph (ASCII)\\n\\n`;
            md += "```text\\n";
            const maxErr = Math.max(...h.results.map((r: any) => r.errors), 1);
            h.results.forEach((r: any) => {
                const barLen = Math.max(0, Math.round((r.errors / maxErr) * 40));
                const bar = "\\u2593".repeat(barLen);
                md += `Val ${r.value.toString().padEnd(5)} | ${bar} ${r.errors}\\n`;
            });
            md += "```\\n\\n";
        });
        
        md += `---\\n\\n## Final AI Analysis\\n\\n${conclusion}\\n`;
        
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chaos-report-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };"""

code = code.replace(old_download, new_download)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
