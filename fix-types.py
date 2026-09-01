import re

with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = re.compile(r"export type ExperimentPlan = \{.*?\};", re.DOTALL)
new_type = """export type MutationAction = 'UPDATE_NODE' | 'DELETE_NODE' | 'ADD_NODE' | 'ADD_EDGE' | 'DELETE_EDGE';
export type ExperimentMutation = {
    action: MutationAction;
    targetId: string;
    targetField?: string;
    values: any[];
};

export type ExperimentPlan = {
    title: string;
    hypothesis: string;
    stepCount: number;
    mutations: ExperimentMutation[];
    maxInFlight?: number;
    totalLimit?: number;
    playbackSpeed?: number;
    stepDurationMs?: number;
    zoomLevel?: number;
    requestsPerSecond?: number;
    onFitView?: () => void;
};"""

code = pattern.sub(new_type, code)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
