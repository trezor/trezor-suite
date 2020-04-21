#!/usr/bin/env python3
import requests
import sys
import os
import time
import signal
from subprocess import Popen, PIPE
from trezorlib.transport.bridge import BridgeTransport

proc = None

# def findProcess():
#     ps = Popen("ps -ef | grep trezord-go", shell=True, stdout=PIPE)
#     output = ps.stdout.read()
#     ps.stdout.close()
#     ps.wait()
#     return output


def loader():
    TREZORD_HOST = "http://0.0.0.0:21325"
    CONNECTION = requests.Session()
    CONNECTION.headers.update({"Origin": "https://python.trezor.io"})

    start = time.monotonic()
    waiting = True
    while waiting:
        try:
            r = CONNECTION.post("http://0.0.0.0:21325/enumerate", data=None)
            if r.status_code != 200:
                raise Exception("not connected yet")
            waiting = False
        except Exception as e:
            print(str(e))
            time.sleep(0.5)
    end = time.monotonic()
    print("waited for {:.3f}s".format(end - start))


def start(version):
    global proc
    if proc is None:
        # findProcess()
        # TODO:
        # - check if trezord process is already running and kill it if so
        # - check if Popen process starts without error (if 21325 port is listening)
        
        # normalize path to be relative to this folder, not pwd
        path = os.path.join(os.path.dirname(__file__), './bin')

        command = path + "/trezord-go-v" + version + " -ed 21324:21325 -u=false"

        proc = Popen(
            command,
            shell=True,
            preexec_fn=os.setsid
        )
        loader()
        # TODO: - add else condition and check if trezord is running and if i own this process (trezord pid is the same with proc pid)


def stop():
    global proc
    if proc is not None:
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        proc = None
        time.sleep(2)
