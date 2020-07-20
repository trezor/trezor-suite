import sys
import os
import signal
import time
from subprocess import Popen

from trezorlib import device, debuglink, log
from trezorlib.debuglink import DebugLink, TrezorClientDebugLink
from trezorlib.client import TrezorClient
from trezorlib.device import wipe, reset, backup

from trezorlib.transport.udp import UdpTransport
from trezorlib.transport.bridge import BridgeTransport

import bridge

# buttons positions on screen, might be useful later
# import common.buttons

proc = None

# when communicating with device via bridge/debuglink, this sleep is required otherwise there
# may appear weird race conditions in communications. when not going through bridge but webusb 
# there is no need for it, but we can skip bridge only when doing initial setup before test. 
SLEEP = 0.501
# SLEEP = 1

def get_bridge_device():
    devices = BridgeTransport.enumerate()
    for d in devices:
        d.find_debug()
        return d
    raise RuntimeError("No debuggable bridge device found")


def wait_for_bridge_device():
    start = time.monotonic()
    timeout = 15
    while True:
        try:
            device = get_bridge_device()
            return device
        except:
            elapsed = time.monotonic() - start
            if elapsed >= timeout:
                raise RuntimeError("timed out waiting for bridge device.")
            time.sleep(0.5)


def wait_for_udp_device():
	d = UdpTransport()
	d.wait_until_ready(timeout=8)
	return d


def get_device():
    if (bridge.is_running()):
        return wait_for_bridge_device()
    
    return wait_for_udp_device()


def start(version, wipe):
    global proc

    if proc is not None:
        stop()

    # These are min firmware versions supported by current version of trezorlib 
    # https://github.com/trezor/trezor-firmware/blob/master/python/src/trezorlib/__init__.py
    # MINIMUM_FIRMWARE_VERSION = {
    #     "1": (1, 8, 0),
    #     "T": (2, 1, 0),
    # }

    # normalize path to be relative to this folder, not pwd
    path = os.path.join(os.path.dirname(__file__), 'bin')

    command=""
    if version[0] == "2":
        PROFILE = "/var/tmp/trezor.flash"
        if wipe and os.path.exists(PROFILE):
            os.remove(PROFILE)
    
        command = path + "/trezor-emu-core-v" + version + " -O0 -X heapsize=20M -m main"
    else:
        PROFILE = os.path.join(os.path.dirname(__file__), 'emulator.img')
        if wipe and os.path.exists(PROFILE):
            os.remove(PROFILE)

        # todo: currently we have only 1 legacy firmware. to make it work with debuglink,
        # custom build is necessary as described here 
        # https://github.com/trezor/trezor-firmware/blob/master/docs/legacy/index.md
        command = path + "/trezor-emu-legacy-v" + version + " -O0"

        # todo: add more versions

    if proc is None:
        # TODO:
        # - check if emulator process is already running and kill it if so
        # - detect if Popen process starts without error (if udp port is listening)
        # - run custom firmware
        # - run T1 emulator
        # - run T1 & T2 emulator at once
        # - run two T2/T1 emulators
        proc = Popen(
            command,
            shell=True,
            preexec_fn=os.setsid
        )
        print("the commandline is {}".format(proc.args))


def stop():
    global proc
    if proc is not None:
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        proc = None


def setup_device(mnemonic, pin, passphrase_protection, label, needs_backup=None):
    # TODO:
    # - check if device is acquired otherwise throws "wrong previous session" from bridge
    client = TrezorClientDebugLink(get_device())
    client.open()
    time.sleep(SLEEP)
    debuglink.load_device(
        client,
        mnemonic,
        pin,
        passphrase_protection,
        label,
        needs_backup=bool(needs_backup)
    )
    client.close()


def wipe_device():
    client = TrezorClientDebugLink(get_device())
    client.open()
    time.sleep(SLEEP)
    wipe(client)
    client.close()

def reset_device():
    client = TrezorClientDebugLink(get_device())
    client.open()
    time.sleep(SLEEP)
    reset(client, skip_backup=True, pin_protection=False)
    client.close()


def decision():
    client = DebugLink(get_device().find_debug())
    client.open()
    time.sleep(SLEEP)
    client.press_yes()
    client.close()

# enter recovery word or pin
# enter pin not possible for T2, it is locked, for T1 it is possible
# change pin possible, use input(word=pin-string)
def input(value):
    client = DebugLink(get_device().find_debug())
    client.open()
    time.sleep(SLEEP)
    client.input(value)
    client.close()


def swipe(direction): 
    client = DebugLink(get_device().find_debug())
    client.open()
    time.sleep(SLEEP)
    if direction == 'up':
        client.swipe_up()
    elif direction == 'right':
        client.swipe_right()
    elif direction == 'down':
        client.swipe_down()
    elif direction == 'left':
        client.swipe_left()
    client.close()


def read_and_confirm_mnemonic():
    client = DebugLink(get_device().find_debug())
    client.open()
    time.sleep(SLEEP)
    client.press_yes()
    time.sleep(SLEEP)
    
    # it appears that doing read_mnemonic_secret also skips otherwise necessary "swiping"
    mnem = client.read_mnemonic_secret().decode("utf-8")
    mnemonic = mnem.split()
    time.sleep(SLEEP)
    
    index = client.read_reset_word_pos()
    client.input(mnemonic[index])
    time.sleep(SLEEP)

    index = client.read_reset_word_pos()
    client.input(mnemonic[index])
    time.sleep(SLEEP)

    index = client.read_reset_word_pos()
    client.input(mnemonic[index])
    time.sleep(SLEEP)

    client.press_yes()
    client.press_yes()
    client.close()


def select_num_of_words(num_of_words=12):
    client = DebugLink(get_device().find_debug())
    client.open()
    time.sleep(SLEEP)
    client.input(str(num_of_words))
    client.close()


def apply_settings(passphrase_always_on_device=None):
    client = TrezorClientDebugLink(get_device())
    client.open()
    time.sleep(SLEEP)
    device.apply_settings(
        client,
        passphrase_always_on_device=bool(passphrase_always_on_device),
    )
    client.close()
