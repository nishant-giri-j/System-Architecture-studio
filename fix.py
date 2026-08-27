import re

with open('apps/web/hooks/use-simulation.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find the closing of the generic else block (where `delete inFlightLb.current` is)
# and clean up everything until the `},` of handleArrival.
marker_start = "delete inFlightLb.current[`${arrivedAtId}_${pulse.requestId}`];\n                    }\n                }\n            }"
marker_end = "        },\n        [emitPulse, addLog, createPausableTimeout]\n    );"

if marker_start in content and marker_end in content:
    pre = content.split(marker_start)[0] + marker_start
    post = marker_end + content.split(marker_end)[1]

    new_inner = """
            };

            if (delay > 0 && pulse.type === 'request') {
                createPausableTimeout(executeLogic, delay);
            } else {
                executeLogic();
            }
"""
    with open('apps/web/hooks/use-simulation.ts', 'w', encoding='utf-8') as f:
        f.write(pre + new_inner + post)
    print("Fixed use-simulation.ts!")
else:
    print("Could not find markers!")
