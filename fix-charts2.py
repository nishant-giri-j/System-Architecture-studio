import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_chart_logic = '''                            {status !== 'idle' && status !== 'agent-thinking' && (
                                <>
                                    <div className="mb-6 shrink-0 flex items-center justify-between border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616]">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-4 w-48 border-[2px] border-[#161616] bg-neutral-200">
                                                <div 
                                                    className="absolute inset-y-0 left-0 bg-[#5de2e7] transition-all duration-300"
                                                    style={{ width: `${(results.length / (plan?.steps.length || 1)) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-black uppercase">
                                                {results.length} / {plan?.steps.length} Steps
                                            </span>
                                        </div>
                                        
                                    </div>

                                    {/* Charts */}
                                    <div className="mb-6 flex flex-col gap-8 shrink-0 w-full">
                                        {results.length > 0 ? (
                                            <>
                                                <div className="h-[24rem] w-full border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616] flex flex-col">
                                                    <h4 className="font-black uppercase text-sm mb-4 text-center text-[#161616]">Throughput & Errors (Packets)</h4>
                                                    <div className="flex-1 min-h-0">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <ComposedChart data={results} margin={{ top: 20, right: 40, bottom: 20, left: 20 }} barGap={6}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#161616" opacity={0.2} />
                                                                <XAxis 
                                                                    dataKey="stepIndex" 
                                                                    height={70}
                                                                    stroke="#161616" 
                                                                    tick={{ fontWeight: 900, fontSize: 11, angle: -20, textAnchor: 'end', dy: 15 }}
                                                                    tickFormatter={(val) => {
                                                                        const numVal = Number(val);
                                                                        const r = results.find(x => x.stepIndex === numVal);
                                                                        return r ? `Step ${numVal} (${r.value})` : val;
                                                                    }}
                                                                />
                                                                <YAxis 
                                                                    width={60}
                                                                    stroke="#161616" 
                                                                    tick={{ fontWeight: 900, fontSize: 12 }}
                                                                    domain={[0, (dataMax: number) => Math.max(dataMax, 10)]}
                                                                />
                                                                <RechartsTooltip contentStyle={{ border: '3px solid #161616', borderRadius: 0, boxShadow: '4px 4px 0 #161616', fontWeight: 'bold', backgroundColor: '#fffdf5' }} />
                                                                <Legend wrapperStyle={{ fontWeight: 'black', paddingTop: '10px' }} />
                                                                <Bar dataKey="throughput" fill="#5de2e7" stroke="#161616" strokeWidth={3} maxBarSize={50} name="Successful Throughput" />
                                                                <Bar dataKey="errors" fill="#ff6b6b" stroke="#161616" strokeWidth={3} maxBarSize={50} name="Dropped / Errors" />
                                                            </ComposedChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                                
                                                <div className="h-[24rem] w-full border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616] flex flex-col">
                                                    <h4 className="font-black uppercase text-sm mb-4 text-center text-[#ff4fa3]">Average Latency (ms)</h4>
                                                    <div className="flex-1 min-h-0">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <ComposedChart data={results} margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#161616" opacity={0.2} />
                                                                <XAxis 
                                                                    dataKey="stepIndex" 
                                                                    height={70}
                                                                    stroke="#161616" 
                                                                    tick={{ fontWeight: 900, fontSize: 11, angle: -20, textAnchor: 'end', dy: 15 }}
                                                                    tickFormatter={(val) => {
                                                                        const numVal = Number(val);
                                                                        const r = results.find(x => x.stepIndex === numVal);
                                                                        return r ? `Step ${numVal} (${r.value})` : val;
                                                                    }}
                                                                />
                                                                <YAxis 
                                                                    width={60}
                                                                    stroke="#ff4fa3" 
                                                                    tick={{ fontWeight: 900, fontSize: 12 }}
                                                                    domain={[0, (dataMax: number) => Math.max(dataMax, 10)]}
                                                                />
                                                                <RechartsTooltip contentStyle={{ border: '3px solid #161616', borderRadius: 0, boxShadow: '4px 4px 0 #161616', fontWeight: 'bold', backgroundColor: '#fffdf5' }} />
                                                                <Legend wrapperStyle={{ fontWeight: 'black', paddingTop: '10px' }} />
                                                                <Line type="monotone" dataKey="avgLatency" stroke="#ff4fa3" strokeWidth={5} name="Avg Latency (ms)" dot={{ strokeWidth: 3, r: 6, fill: '#fff', stroke: '#161616' }} activeDot={{ r: 8, fill: '#ff4fa3', stroke: '#161616', strokeWidth: 3 }} />
                                                            </ComposedChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-64 w-full border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616] flex items-center justify-center">
                                                <span className="text-sm font-black text-neutral-400 uppercase">Waiting for data...</span>
                                            </div>
                                        )}
                                    </div>'''

new_chart_logic = '''                            {status !== 'idle' && status !== 'agent-thinking' && (
                                <>
                                    {status === 'running' && (
                                        <div className="mb-6 shrink-0 flex items-center justify-between border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616]">
                                            <div className="flex items-center gap-4">
                                                <div className="relative h-4 w-48 border-[2px] border-[#161616] bg-neutral-200">
                                                    <div 
                                                        className="absolute inset-y-0 left-0 bg-[#5de2e7] transition-all duration-300"
                                                        style={{ width: `${(results.length / (plan?.steps.length || 1)) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-black uppercase">
                                                    {results.length} / {plan?.steps.length} Steps (Running Experiment {history.length + 1})
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* All Historical and Current Charts */}
                                    <div className="mb-6 flex flex-col gap-12 shrink-0 w-full">
                                        {[...history, ...(results.length > 0 ? [{ plan: plan!, results }] : [])].map((item, index) => (
                                            <div key={index} className="flex flex-col gap-8 pb-8 border-b-[4px] border-dashed border-[#161616] last:border-b-0">
                                                <div className="bg-[#161616] text-[#9cf57a] p-3 text-sm font-black uppercase self-start">
                                                    Experiment {index + 1}: {item.plan.targetField} on {nodes.find(n => n.id === item.plan.targetNodeId)?.data.label || item.plan.targetNodeId}
                                                </div>
                                                
                                                <div className="h-[24rem] w-full border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616] flex flex-col">
                                                    <h4 className="font-black uppercase text-sm mb-4 text-center text-[#161616]">Throughput & Errors (Packets)</h4>
                                                    <div className="flex-1 min-h-0">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <ComposedChart data={item.results} margin={{ top: 20, right: 40, bottom: 20, left: 20 }} barGap={6}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#161616" opacity={0.2} />
                                                                <XAxis 
                                                                    dataKey="stepIndex" 
                                                                    height={70}
                                                                    stroke="#161616" 
                                                                    tick={{ fontWeight: 900, fontSize: 11, angle: -20, textAnchor: 'end', dy: 15 }}
                                                                    tickFormatter={(val) => {
                                                                        const numVal = Number(val);
                                                                        const r = item.results.find(x => x.stepIndex === numVal);
                                                                        return r ? `Step ${numVal} (${r.value})` : val;
                                                                    }}
                                                                />
                                                                <YAxis 
                                                                    width={60}
                                                                    stroke="#161616" 
                                                                    tick={{ fontWeight: 900, fontSize: 12 }}
                                                                    domain={[0, (dataMax: number) => Math.max(dataMax, 10)]}
                                                                />
                                                                <RechartsTooltip contentStyle={{ border: '3px solid #161616', borderRadius: 0, boxShadow: '4px 4px 0 #161616', fontWeight: 'bold', backgroundColor: '#fffdf5' }} />
                                                                <Legend wrapperStyle={{ fontWeight: 'black', paddingTop: '10px' }} />
                                                                <Bar dataKey="throughput" fill="#5de2e7" stroke="#161616" strokeWidth={3} maxBarSize={50} name="Successful Throughput" />
                                                                <Bar dataKey="errors" fill="#ff6b6b" stroke="#161616" strokeWidth={3} maxBarSize={50} name="Dropped / Errors" />
                                                            </ComposedChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                                
                                                <div className="h-[24rem] w-full border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616] flex flex-col">
                                                    <h4 className="font-black uppercase text-sm mb-4 text-center text-[#ff4fa3]">Average Latency (ms)</h4>
                                                    <div className="flex-1 min-h-0">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <ComposedChart data={item.results} margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#161616" opacity={0.2} />
                                                                <XAxis 
                                                                    dataKey="stepIndex" 
                                                                    height={70}
                                                                    stroke="#161616" 
                                                                    tick={{ fontWeight: 900, fontSize: 11, angle: -20, textAnchor: 'end', dy: 15 }}
                                                                    tickFormatter={(val) => {
                                                                        const numVal = Number(val);
                                                                        const r = item.results.find(x => x.stepIndex === numVal);
                                                                        return r ? `Step ${numVal} (${r.value})` : val;
                                                                    }}
                                                                />
                                                                <YAxis 
                                                                    width={60}
                                                                    stroke="#ff4fa3" 
                                                                    tick={{ fontWeight: 900, fontSize: 12 }}
                                                                    domain={[0, (dataMax: number) => Math.max(dataMax, 10)]}
                                                                />
                                                                <RechartsTooltip contentStyle={{ border: '3px solid #161616', borderRadius: 0, boxShadow: '4px 4px 0 #161616', fontWeight: 'bold', backgroundColor: '#fffdf5' }} />
                                                                <Legend wrapperStyle={{ fontWeight: 'black', paddingTop: '10px' }} />
                                                                <Line type="monotone" dataKey="avgLatency" stroke="#ff4fa3" strokeWidth={5} name="Avg Latency (ms)" dot={{ strokeWidth: 3, r: 6, fill: '#fff', stroke: '#161616' }} activeDot={{ r: 8, fill: '#ff4fa3', stroke: '#161616', strokeWidth: 3 }} />
                                                            </ComposedChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {history.length === 0 && results.length === 0 && (
                                            <div className="h-64 w-full border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616] flex items-center justify-center">
                                                <span className="text-sm font-black text-neutral-400 uppercase">Waiting for data...</span>
                                            </div>
                                        )}
                                    </div>'''

code = code.replace(old_chart_logic, new_chart_logic)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
