#!/usr/bin/env python3
import os
import time
import signal
import http.client

from subprocess import Popen, PIPE
from trezorlib.transport.bridge import BridgeTransport

proc = None

# def findProcess():
#     ps = Popen("ps -ef | grep trezord-go", shell=True, stdout=PIPE)
#     output = ps.stdout.read()
#     ps.stdout.close()
#     ps.wait()
#     return output

# todo: checking http response is suboptimal, it would be better to check if there is process running
def is_running():
    try:
        conn = http.client.HTTPConnection("0.0.0.0", 21325)
        conn.request("GET", "/status/")
        r = conn.getresponse()
        if r.status == 200:
            return True
        return False
    except:
        return False


def start(version):
    global proc
    if proc is None:
        # findProcess()
        # TODO:
        # - check if trezord process is already running and kill it if so
        
        # normalize path to be relative to this folder, not pwd
        path = os.path.join(os.path.dirname(__file__), './bin')

        command = path + "/trezord-go-v" + version + " -ed 21324:21325 -u=false"

        proc = Popen(
            command,
            shell=True,
            preexec_fn=os.setsid
        )
        # TODO: - add else condition and check if trezord is running and if i own this process (trezord pid is the same with proc pid)


def stop():
    global proc
    if proc is not None:
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        proc = None
