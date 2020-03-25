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
    TREZORD_HOST = "http://127.0.0.1:21325"
    CONNECTION = requests.Session()
    CONNECTION.headers.update({"Origin": "https://python.trezor.io"})

    start = time.monotonic()
    waiting = True
    while waiting:
        try:
            r = CONNECTION.post("http://127.0.0.1:21325/enumerate", data=None)
            if r.status_code != 200:
                raise Exception("not connected yet")
            waiting = False
        except Exception as e:
            print(str(e))
            time.sleep(0.5)
    end = time.monotonic()
    print("waited for {:.3f}s".format(end - start))


def start():
    global proc
    if proc is None:
        # findProcess()
        # TODO:
        # - check if trezord process is already running and kill it if so
        # - check if Popen process starts without error (if 21325 port is listening)
        base = "./projects/suite-web/plugins/python/bin/trezord-go -ed 21324:21325"
        command = base + " -u=false" if 'CI' in os.environ else base
        print(command)
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
