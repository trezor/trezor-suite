"""Sample host resource counters without process arguments or environment values."""
import datetime
import json
import subprocess
import time

while True:
    sample = {"time": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    for name, command in {
        "processes": ["ps", "-axo", "pid,ppid,rss,vsz,comm"],
        "virtual_memory": ["vm_stat"],
        "swap": ["sysctl", "vm.swapusage"],
        "pressure": ["memory_pressure", "-Q"],
    }.items():
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=8)
            output = result.stdout
            if name == "processes":
                rows = [line.split(None, 4) for line in output.splitlines()[1:]]
                rows = [r for r in rows if len(r) == 5 and r[2].isdigit()]
                rows.sort(key=lambda r: int(r[2]), reverse=True)
                sample[name] = [
                    {"pid": int(r[0]), "ppid": int(r[1]), "rss_kib": int(r[2]),
                     "vsz_kib": int(r[3]), "executable": r[4].rsplit("/", 1)[-1]}
                    for r in rows[:20]
                ]
            else:
                sample[name] = output.strip()
        except (OSError, subprocess.TimeoutExpired) as error:
            sample[name] = {"error": type(error).__name__}
    print(json.dumps(sample), flush=True)
    time.sleep(1)
