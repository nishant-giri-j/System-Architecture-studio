with open('apps/web/components/canvas/experiment-modal.tsx', 'rb') as f:
    raw = f.read()

try:
    code = raw.decode('utf-8')
except:
    code = raw.decode('utf-16')

import re

# Remove all blank lines to make line counts reasonable
lines = code.split('\n')
non_empty = [l for l in lines if l.strip()]
code = '\n'.join(non_empty)

# Find the LAST export function
parts = code.split("export function ExperimentModal")
if len(parts) > 1:
    header = parts[0]
    # Remove everything between the first import and the last export, except imports and types
    # Actually, let's just keep the imports and types from the top.
    import_match = re.search(r'export type ExperimentPlan.*?interface ExperimentModalProps \{.*?\}', header, re.DOTALL)
    if import_match:
        types = import_match.group(0)
    else:
        types = ""
    
    top = """'use client';
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Loader2, Beaker, BrainCircuit, Sparkles } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Node } from '@xyflow/react';
import type { ArchitectureNodeData } from './architecture-node';

""" + types

    # The actual component body
    body = "export function ExperimentModal" + parts[-1]
    
    # We need to fix the Recharts issue by extracting the text area into a sub-component so typing doesn't re-render ExperimentModal.
    # Actually, an even easier way to avoid Recharts "Maximum update depth exceeded" from textarea typing
    # is to just decouple `prompt` state!
    # Let's replace `const [prompt, setPrompt] = useState('');` with `const promptRef = useRef('');`
    # But wait, it's a controlled component!
    # Let's replace the textarea block with a new UncontrolledPrompt component!
    
    # Inject UncontrolledPrompt at the top
    uncontrolled = """
const PromptInput = ({ initialValue, onChange, disabled, onRun }: any) => {
    const [local, setLocal] = useState(initialValue);
    
    useEffect(() => {
        setLocal(initialValue);
    }, [initialValue]);

    return (
        <div className="flex flex-col gap-4">
            <textarea
                className="mt-2 w-full resize-none border-[3px] border-[#161616] bg-[#fffdf5] p-3 text-sm font-semibold outline-none focus:bg-[#ffde59] transition-colors"
                rows={5}
                placeholder="e.g., 'What happens if we slowly drop the cache hit rate on the Redis node?' or 'Increase the processing delay on API Gateway by 50ms gaps.'"
                value={local}
                onChange={(e) => {
                    setLocal(e.target.value);
                    onChange(e.target.value);
                }}
                disabled={disabled}
            />
            <div className="flex flex-wrap gap-2">
                {['E-commerce platform with microservices', 'Real-time chat app with WebSocket', 'ML inference pipeline with GPU workers'].map(ex => (
                    <button 
                        key={ex}
                        onClick={() => { setLocal(ex); onChange(ex); }}
                        className="bg-[#161616] text-[#fffdf5] px-3 py-1.5 text-xs font-black uppercase hover:-translate-y-0.5 hover:bg-[#ff4fa3] transition-all shadow-[2px_2px_0_#ffde59]"
                        disabled={disabled}
                    >
                        {ex}
                    </button>
                ))}
            </div>
            <button
                onClick={onRun}
                disabled={disabled || !local}
                className="neo-button w-full bg-[#ff4fa3] text-white border-[3px] border-[#161616] py-3 text-sm font-black uppercase tracking-wider shadow-[4px_4px_0_#161616] hover:-translate-y-1 hover:shadow-[6px_6px_0_#161616] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_#161616] flex items-center justify-center gap-2"
            >
                {disabled ? <Loader2 size={18} strokeWidth={3} className="animate-spin" /> : <Play size={18} strokeWidth={3} />}
                Generate & Run
            </button>
        </div>
    );
};
"""
    top += uncontrolled
    
    # Replace the textarea inside the body
    old_textarea = """<textarea
                                className="mt-2 w-full resize-none border-[3px] border-[#161616] bg-[#fffdf5] p-3 text-sm font-semibold outline-none focus:bg-[#ffde59] transition-colors"
                                rows={5}
                                placeholder="e.g., 'What happens if we slowly drop the cache hit rate on the Redis node?' or 'Increase the processing delay on API Gateway by 50ms gaps.'"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={status !== 'idle' && status !== 'done'}
                            />"""
    # Replace everything from <textarea to Generate & Run button with <PromptInput />
    # We will just use regex to replace the whole block
    import re
    body = re.sub(r'<textarea.*?</button>\s*</div>\s*<button[^>]*handleStartChaosAgent.*?</button>', 
                  '<PromptInput initialValue={prompt} onChange={setPrompt} disabled={status !== \'idle\' && status !== \'done\'} onRun={handleStartChaosAgent} />', 
                  body, flags=re.DOTALL)
    
    # Now write the cleaned file
    with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
        f.write(top + '\n' + body)
    print("Done rewriting")

