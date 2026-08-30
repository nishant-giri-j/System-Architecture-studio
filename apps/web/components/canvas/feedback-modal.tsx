import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, CheckCircle2, Loader2, Bug } from 'lucide-react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const [feedback, setFeedback] = useState('');
    const [email, setEmail] = useState('');
    const [type, setType] = useState<'bug' | 'feature' | 'loophole'>('bug');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setFeedback('');
            setEmail('');
            setType('bug');
            setIsSubmitting(false);
            setIsSuccess(false);
            setError(null);
        }
    }, [isOpen]);

    // Handle Escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isSubmitting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!feedback.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    feedback, 
                    type,
                    email,
                    userAgent: navigator.userAgent 
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to submit feedback');
            }

            setIsSuccess(true);
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onPointerDown={!isSubmitting ? onClose : undefined}
        >
            <div 
                className="w-full max-w-lg bg-[#fffdf5] border-[3px] border-[#161616] shadow-[12px_12px_0_#161616] flex flex-col animate-in zoom-in-95 duration-200"
                onPointerDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b-[3px] border-[#161616] p-4 bg-[#ffde59]">
                    <div className="flex items-center gap-2">
                        <MessageSquare size={24} strokeWidth={3} className="text-[#161616]" />
                        <h2 className="font-black uppercase tracking-wider text-xl m-0">Report & Feedback</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="hover:bg-white/50 p-2 rounded-sm transition-colors border-[2px] border-transparent hover:border-[#161616] disabled:opacity-50"
                        title="Close"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col gap-5">
                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center gap-4 animate-in fade-in zoom-in">
                            <div className="h-16 w-16 rounded-full bg-[#9cf57a] border-[3px] border-[#161616] flex items-center justify-center shadow-[4px_4px_0_#161616]">
                                <CheckCircle2 size={32} strokeWidth={3} className="text-[#161616]" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-wide">Thank You!</h3>
                            <p className="font-bold text-gray-700">
                                Your feedback has been recorded successfully. It helps us improve the system.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm font-bold text-gray-700 leading-relaxed">
                                Found a loophole? Encountered a bug? Or have a feature request? Let us know below.
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setType('bug')}
                                    className={`flex-1 border-[3px] border-[#161616] py-2 px-3 text-xs font-black uppercase transition-all ${type === 'bug' ? 'bg-[#ff6b6b] text-white shadow-[2px_2px_0_#161616] translate-y-0.5' : 'bg-white hover:bg-gray-100 shadow-[4px_4px_0_#161616]'}`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Bug size={14} strokeWidth={3} /> Bug
                                    </div>
                                </button>
                                <button
                                    onClick={() => setType('loophole')}
                                    className={`flex-1 border-[3px] border-[#161616] py-2 px-3 text-xs font-black uppercase transition-all ${type === 'loophole' ? 'bg-[#ff4fa3] text-white shadow-[2px_2px_0_#161616] translate-y-0.5' : 'bg-white hover:bg-gray-100 shadow-[4px_4px_0_#161616]'}`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <MessageSquare size={14} strokeWidth={3} /> Loophole
                                    </div>
                                </button>
                                <button
                                    onClick={() => setType('feature')}
                                    className={`flex-1 border-[3px] border-[#161616] py-2 px-3 text-xs font-black uppercase transition-all ${type === 'feature' ? 'bg-[#5de2e7] text-[#161616] shadow-[2px_2px_0_#161616] translate-y-0.5' : 'bg-white hover:bg-gray-100 shadow-[4px_4px_0_#161616]'}`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Send size={14} strokeWidth={3} /> Request
                                    </div>
                                </button>
                            </div>
                            
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Your email (optional)"
                                className="w-full p-3 border-[3px] border-[#161616] bg-white font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#ffde59]/50 shadow-[4px_4px_0_#161616]"
                                disabled={isSubmitting}
                            />

                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Describe the issue, bug, or loophole in detail..."
                                className="w-full min-h-[150px] resize-y p-3 border-[3px] border-[#161616] bg-white font-mono text-sm focus:outline-none focus:ring-4 focus:ring-[#ffde59]/50 shadow-[4px_4px_0_#161616]"
                                disabled={isSubmitting}
                            />

                            {error && (
                                <div className="p-3 bg-[#ff6b6b]/10 border-l-[4px] border-[#ff6b6b] text-[#ff6b6b] font-bold text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !feedback.trim()}
                                className="neo-button mt-2 w-full flex items-center justify-center gap-2 bg-[#9cf57a] p-4 text-base font-black uppercase border-[3px] border-[#161616] shadow-[6px_6px_0_#161616] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_#161616] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[6px_6px_0_#161616]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={20} strokeWidth={3} className="animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} strokeWidth={3} />
                                        Submit Feedback
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
