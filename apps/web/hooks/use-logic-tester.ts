import { useState, useRef } from "react";
import type { AiLogicTestResult } from "@architecture-studio/shared";

export function useLogicTester() {
    const [isTesting, setIsTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const cancelTest = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsTesting(false);
    };

    const runTest = async (
        nodes: any[],
        edges: any[],
    ): Promise<AiLogicTestResult | null> => {
        // Cancel any existing request
        cancelTest();
        
        setIsTesting(true);
        setError(null);
        
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const res = await fetch("/api/ai/logic-tester", {
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

            const data: AiLogicTestResult = await res.json();
            return data;
        } catch (err: any) {
            if (err.name === 'AbortError') {
                return null; // Don't show error if aborted
            }
            setError(err.message || "Failed to run logic tester.");
            return null;
        } finally {
            if (abortControllerRef.current === abortController) {
                setIsTesting(false);
                abortControllerRef.current = null;
            }
        }
    };

    return {
        runTest,
        cancelTest,
        isTesting,
        error,
    };
}
