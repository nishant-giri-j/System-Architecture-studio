with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import re

# We need to extract the History map rendering and put it in a memoized component.
# Or, simpler: just don't pass inline objects to Recharts, OR memoize the chart data.
# The simplest fix for Recharts "update depth exceeded" is to decouple the textarea state from the heavy charts!
# Let's extract the Prompt input into a separate component!
