"""Extract only native termination reasons and symbols; omit registers, memory, and environment."""
import datetime
import json
import os
from pathlib import Path
import subprocess
import time

reports = []
for directory in [Path.home() / "Library/Logs/DiagnosticReports", Path("/Library/Logs/DiagnosticReports")]:
    if not directory.exists():
        continue
    for path in directory.glob("*.ips"):
        if not path.name.lower().startswith(("node", "jest", "detox")) or time.time() - path.stat().st_mtime > 7200:
            continue
        try:
            text = path.read_text()
            decoder = json.JSONDecoder()
            _, offset = decoder.raw_decode(text)
            data = json.loads(text[offset:])
            report = {key: data.get(key) for key in ["procName", "pid", "parentPid", "captureTime", "faultingThread"]}
            report["exception"] = {key: data.get("exception", {}).get(key) for key in ["type", "signal", "codes", "subtype"]}
            report["termination"] = {key: data.get("termination", {}).get(key) for key in ["namespace", "code", "indicator", "byProc", "byPid"]}
            images = data.get("usedImages", [])
            threads = data.get("threads", [])
            index = data.get("faultingThread")
            if isinstance(index, int) and index < len(threads):
                report["frames"] = []
                for frame in threads[index].get("frames", [])[:30]:
                    image_index = frame.get("imageIndex")
                    image = images[image_index].get("name") if isinstance(image_index, int) and image_index < len(images) else None
                    report["frames"].append({"symbol": frame.get("symbol"), "image": image})
            reports.append(report)
        except (OSError, ValueError, TypeError, KeyError):
            reports.append({"file": path.name, "error": "unreadable crash signature"})

summary = {"time": datetime.datetime.now(datetime.timezone.utc).isoformat(), "native_crashes": reports}
try:
    result = subprocess.run([
        "log", "show", "--last", "90m", "--style", "ndjson", "--predicate",
        'process == "kernel" AND (eventMessage CONTAINS[c] "memorystatus" OR eventMessage CONTAINS[c] "jetsam" OR eventMessage CONTAINS[c] "cs_invalid_page")'
    ], capture_output=True, text=True, timeout=45)
    events = []
    for line in result.stdout.splitlines():
        try:
            event = json.loads(line)
            events.append({key: event.get(key) for key in ["timestamp", "eventMessage"]})
        except ValueError:
            continue
    summary["kernel_memory_and_codesigning_events"] = events
    summary["kernel_log_exit_code"] = result.returncode
except (OSError, subprocess.TimeoutExpired) as error:
    summary["kernel_log_error"] = type(error).__name__

output = Path(os.environ.get("RUNNER_TEMP", "/tmp")) / "ios-crash-signatures.json"
output.write_text(json.dumps(summary, indent=2))
print(json.dumps(summary))
