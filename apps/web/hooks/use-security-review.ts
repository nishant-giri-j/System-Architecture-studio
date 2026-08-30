import { useState, useRef } from "react";
import type { AiSecurityReviewResult } from "@architecture-studio/shared";

export function useSecurityReview() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const cancelReview = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsAnalyzing(false);
    };

    const runReview = async (
        nodes: any[],
        edges: any[],
    ): Promise<AiSecurityReviewResult | null> => {
        // Cancel any existing request
        cancelReview();
        
        setIsAnalyzing(true);
        setError(null);
        
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const res = await fetch("/api/ai/security-review", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ nodes, edges }),
                signal: abortController.signal,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(
                    errorData.error || `Server error: ${res.status}`,
                );
            }

            const data: AiSecurityReviewResult = await res.json();
            return data;
        } catch (err: any) {
            if (err.name === 'AbortError') {
                return null; // Don't show error if aborted
            }
            setError(err.message || "Failed to run security review.");
            return null;
        } finally {
            if (abortControllerRef.current === abortController) {
                setIsAnalyzing(false);
                abortControllerRef.current = null;
            }
        }
    };

    return {
        runReview,
        cancelReview,
        isAnalyzing,
        error,
    };
}
