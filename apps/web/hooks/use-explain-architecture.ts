import { useState, useCallback, useRef } from "react";
import type { ArchitectureFlowNode } from "../components/canvas/architecture-node";
import type { EventFlowEdge } from "../components/canvas/event-edge";

export function useExplainArchitecture() {
    const [isExplaining, setIsExplaining] = useState(false);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const generateExplanation = useCallback(async (nodes: ArchitectureFlowNode[], edges: EventFlowEdge[]) => {
        setIsExplaining(true);
        setError(null);
        
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch("/api/ai/explain-architecture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nodes, edges }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || `API error: ${response.status}`);
            }

            const data = await response.json();
            setExplanation(data.explanation);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Explanation generation cancelled by user');
                return;
            }
            console.error("Explanation failed:", error);
            setError(error.message);
        } finally {
            setIsExplaining(false);
        }
    }, []);

    const cancelExplanation = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsExplaining(false);
    }, []);

    const clearExplanation = useCallback(() => {
        setExplanation(null);
        setError(null);
    }, []);

    return {
        generateExplanation,
        cancelExplanation,
        clearExplanation,
        isExplaining,
        explanation,
        error
    };
}
