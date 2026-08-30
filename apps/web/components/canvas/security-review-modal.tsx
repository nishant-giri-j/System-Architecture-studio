"use client";

import { ShieldAlert, X, Loader2, Download, AlertTriangle, Shield, CheckCircle, Flame, Trash2 } from "lucide-react";
import type { AiSecurityReviewResult } from "@architecture-studio/shared";

interface SecurityReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRunAnalysis: () => void;
    onCancel: () => void;
    onDownload: () => void;
    onClear?: () => void;
    isAnalyzing: boolean;
    results: AiSecurityReviewResult | null;
    error: string | null;
    onAutoResolve?: (id: string, issueText: string) => void;
    onCancelAutoResolve?: () => void;
    isResolving?: string | null;
}

const severityColors = {
    critical: "bg-[#ff4fa3] text-white border-[#161616]", // Pink/Red
    high: "bg-[#ffad66] text-white border-[#161616]", // Orange
    medium: "bg-[#ffde59] text-black border-[#161616]", // Yellow
    low: "bg-[#9cf57a] text-black border-[#161616]", // Green
};

const typeIcons = {
    spof: AlertTriangle,
    bottleneck: Loader2,
    security: ShieldAlert,
    "zero-day": Flame,
    compliance: Shield,
};

export function SecurityReviewModal({
    isOpen,
    onClose,
    onRunAnalysis,
    onCancel,
    onDownload,
    onClear,
    isAnalyzing,
    results,
    error,
    onAutoResolve,
    onCancelAutoResolve,
    isResolving,
}: SecurityReviewModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="flex w-full max-w-4xl max-h-[90vh] flex-col border-[3px] border-[#161616] bg-[#fffdf5] shadow-[12px_12px_0_#161616] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b-[3px] border-[#161616] bg-[#ff6b6b] px-5 py-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center bg-white border-[2px] border-[#161616]">
                            <ShieldAlert size={18} strokeWidth={3} className="text-[#ff6b6b]" />
                        </div>
                        <h2 className="m-0 text-xl font-black uppercase tracking-wide">
                            Security Review
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="neo-button grid h-8 w-8 place-items-center bg-white text-black hover:bg-gray-100"
                        title="Close"
                    >
                        <X size={18} strokeWidth={3} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Empty State / Before Analysis */}
                    {!results && !isAnalyzing && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <ShieldAlert size={64} strokeWidth={1.5} className="mb-4 text-gray-400" />
                            <h3 className="mb-2 text-2xl font-black uppercase">Scan Your Architecture</h3>
                            <p className="mb-8 max-w-md text-sm font-bold text-gray-600">
                                Run an AI-powered security review to detect vulnerabilities, bottlenecks, Single Points of Failure (SPOFs), and potential attack vectors in your design.
                            </p>
                            <button
                                onClick={onRunAnalysis}
                                className="neo-button flex items-center gap-2 bg-[#ff6b6b] px-8 py-4 text-lg font-black uppercase text-white shadow-[4px_4px_0_#161616] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_#161616] transition-all"
                            >
                                <ShieldAlert size={20} strokeWidth={3} />
                                Run Analysis
                            </button>
                            {error && (
                                <div className="mt-6 border-[3px] border-[#161616] bg-red-100 px-4 py-3 text-sm font-bold text-red-600">
                                    Error: {error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Analyzing State */}
                    {isAnalyzing && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Loader2 size={48} strokeWidth={3} className="mb-6 animate-spin text-[#ff6b6b]" />
                            <h3 className="text-xl font-black uppercase animate-pulse">Analyzing Architecture...</h3>
                            <p className="mt-2 mb-8 text-sm font-bold text-gray-600">Checking for SPOFs, zero-days, and bottlenecks.</p>
                            
                            <button
                                onClick={onCancel}
                                className="neo-button flex items-center gap-2 bg-gray-200 px-6 py-3 text-sm font-black uppercase text-gray-800 shadow-[4px_4px_0_#161616] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_#161616] transition-all"
                            >
                                <X size={16} strokeWidth={3} />
                                Stop Analysis
                            </button>
                        </div>
                    )}

                    {/* Results State */}
                    {results && !isAnalyzing && (
                        <div className="flex flex-col gap-6">
                            {/* Summary Card */}
                            <div className="flex flex-col md:flex-row gap-4 border-[3px] border-[#161616] bg-white p-4 shadow-[4px_4px_0_#161616]">
                                <div className="flex flex-col items-center justify-center border-r-[3px] border-[#161616] pr-4 md:w-32 shrink-0">
                                    <span className="text-xs font-black uppercase text-gray-500 mb-1">Risk Score</span>
                                    <span className={`text-4xl font-black ${results.overallRiskScore > 70 ? "text-[#ff4fa3]" : results.overallRiskScore > 40 ? "text-[#ff6b6b]" : results.overallRiskScore > 20 ? "text-yellow-600" : "text-[#9cf57a]"}`}>
                                        {results.overallRiskScore}
                                    </span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-sm font-bold">{results.summary}</p>
                                </div>
                                <div className="md:ml-auto flex flex-col gap-2 items-center justify-center border-t-[3px] border-[#161616] md:border-t-0 md:border-l-[3px] md:pl-4 pt-4 md:pt-0 shrink-0">
                                    <button
                                        onClick={onRunAnalysis}
                                        className="neo-button flex w-full items-center justify-center gap-2 bg-[#ffde59] px-4 py-2 text-sm font-black uppercase shadow-[2px_2px_0_#161616] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_#161616]"
                                    >
                                        <ShieldAlert size={16} strokeWidth={3} />
                                        Re-Analyze
                                    </button>
                                    <button
                                        onClick={onDownload}
                                        className="neo-button flex w-full items-center justify-center gap-2 bg-[#5de2e7] px-4 py-2 text-sm font-black uppercase shadow-[2px_2px_0_#161616] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_#161616]"
                                    >
                                        <Download size={16} strokeWidth={3} />
                                        Download Report
                                    </button>
                                    {onClear && (
                                        <button
                                            onClick={onClear}
                                            className="neo-button flex w-full items-center justify-center gap-2 bg-[#ff6b6b] text-white px-4 py-2 text-sm font-black uppercase shadow-[2px_2px_0_#161616] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_#161616]"
                                        >
                                            <Trash2 size={16} strokeWidth={3} />
                                            Clear Results
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Vulnerabilities List */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-lg font-black uppercase border-b-[3px] border-[#161616] pb-2">Findings ({results.vulnerabilities.length})</h3>
                                {results.vulnerabilities.length === 0 ? (
                                    <div className="flex items-center gap-3 border-[3px] border-[#161616] bg-[#9cf57a] p-4 text-sm font-bold">
                                        <CheckCircle size={20} strokeWidth={3} />
                                        No significant vulnerabilities found. Great job!
                                    </div>
                                ) : (
                                    results.vulnerabilities.map((vuln) => {
                                        const Icon = typeIcons[vuln.type as keyof typeof typeIcons] || ShieldAlert;
                                        return (
                                            <div key={vuln.id} className="border-[3px] border-[#161616] bg-white shadow-[4px_4px_0_#161616] flex flex-col">
                                                <div className="flex items-center gap-3 border-b-[3px] border-[#161616] bg-gray-50 px-4 py-2">
                                                    <div className={`px-2 py-1 text-[10px] font-black uppercase border-2 ${severityColors[vuln.severity]}`}>
                                                        {vuln.severity}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] font-black uppercase text-gray-500 bg-white border-2 border-gray-200 px-2 py-1">
                                                        <Icon size={12} strokeWidth={3} />
                                                        {vuln.type}
                                                    </div>
                                                    <h4 className="ml-auto text-sm font-black uppercase">{vuln.title}</h4>
                                                </div>
                                                <div className="p-4">
                                                    <p className="mb-3 text-sm font-bold text-gray-800">{vuln.description}</p>
                                                    <div className="border-[2px] border-[#161616] bg-[#ffde59]/20 p-3">
                                                        <p className="text-xs font-black uppercase text-gray-600 mb-1">Recommended Fix:</p>
                                                        <p className="text-sm font-bold text-gray-800">{vuln.remediation}</p>
                                                    </div>
                                                    {onAutoResolve && (
                                                        <div className="mt-3 flex gap-2">
                                                            {isResolving === vuln.id ? (
                                                                <button
                                                                    onClick={() => onCancelAutoResolve && onCancelAutoResolve()}
                                                                    className="neo-button flex-1 flex items-center justify-center gap-2 bg-[#ff6b6b] text-white px-4 py-2 text-sm font-black uppercase shadow-[2px_2px_0_#161616] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_#161616]"
                                                                >
                                                                    <X size={16} strokeWidth={3} /> Cancel
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => onAutoResolve(vuln.id, `${vuln.title}: ${vuln.description} Fix: ${vuln.remediation}`)}
                                                                    disabled={isResolving !== null}
                                                                    className="neo-button flex-1 flex items-center justify-center gap-2 bg-[#5de2e7] px-4 py-2 text-sm font-black uppercase shadow-[2px_2px_0_#161616] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_#161616]"
                                                                >
                                                                    ✨ Auto Resolve
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
