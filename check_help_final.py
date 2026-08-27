with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if "Information & Reference" in content:
    print("SUCCESS: Information & Reference is inserted!")
else:
    print("FAILED: Information & Reference missing")

if "Live Telemetry" in content:
    print("SUCCESS: Live Telemetry is inserted!")
else:
    print("FAILED: Live Telemetry missing")
