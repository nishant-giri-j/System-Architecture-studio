import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the card onClick handler
old_card_onclick = """                                            onClick={() => {
                                                setPlan(p);
                                                if (p.playbackSpeed) setPlaybackSpeed(p.playbackSpeed);
                                                if (p.requestsPerSecond) setRequestsPerSecond(p.requestsPerSecond);
                                                if (onFitView) onFitView();
                                                setStatus('running');
                                                setIsPlaying(true);
                                            }}"""

new_card_onclick = """                                            onClick={() => {
                                                setPlan(p);
                                                setResults([]);
                                                setCurrentStep(0);
                                                
                                                const target = nodes.find(n => n.id === p.targetNodeId);
                                                if (target) {
                                                    originalNodeState.current = { id: target.id, data: JSON.parse(JSON.stringify(target.data)) };
                                                }
                                                originalLimits.current = { maxInFlight, totalLimit, playbackSpeed, requestsPerSecond };
                                                
                                                if (p.playbackSpeed) setPlaybackSpeed(p.playbackSpeed);
                                                if (p.requestsPerSecond) setRequestsPerSecond(p.requestsPerSecond);
                                                if (onFitView) onFitView();
                                                
                                                setStatus('running');
                                                setIsPlaying(true);
                                            }}"""

code = code.replace(old_card_onclick, new_card_onclick)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
