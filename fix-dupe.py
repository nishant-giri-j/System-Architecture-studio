with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_logic = """            const newHistoryItem = { plan, results };
            const newHistory = [...history, newHistoryItem];
            setHistory(newHistory);
            
            setStatus('agent-thinking');
            callChaosAgent(newHistory, false);
            return;"""

new_logic = """            const newHistoryItem = { plan, results };
            const newHistory = [...history, newHistoryItem];
            setHistory(newHistory);
            setResults([]);
            
            setStatus('agent-thinking');
            callChaosAgent(newHistory, false);
            return;"""

code = code.replace(old_logic, new_logic)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
