import sys
import os
import signal
import time
from subprocess import Popen

from trezorlib import device, debuglink, log
from trezorlib.debuglink import DebugLink, TrezorClientDebugLink
from trezorlib.client import TrezorClient
from trezorlib.device import wipe as wipe

from trezorlib.transport import enumerate_devices, get_transport
from trezorlib.transport.udp import UdpTransport
from trezorlib.transport.bridge import BridgeTransport

from trezorlib import messages as proto
import common.buttons

proc = None
# log.enable_debug_output()


def start(version):
    global proc

    # These are min firmware versions supported by current version of trezorlib 
    # https://github.com/trezor/trezor-firmware/blob/master/python/src/trezorlib/__init__.py
    # MINIMUM_FIRMWARE_VERSION = {
    #     "1": (1, 8, 0),
    #     "T": (2, 1, 0),
    # }

    # normalize path to be relative to this folder, not pwd
    path = os.path.join(os.path.dirname(__file__), './bin')

    command=""
    if version[0] == "2":
        command = path + "/trezor-emu-core-v" + version + " -O0 -X heapsize=20M -m main"
    else:
        # todo: currently we have only 1 legacy firmare. to make it work with debuglink,
        # custom build is necessary as described here 
        # https://github.com/trezor/trezor-firmware/blob/master/docs/legacy/index.md
        command = path + "/trezor.elf -O0"

        # todo: add more versions maybe
        # command = path + "trezor-emu-legacy-v" + version + " -O0"

    if proc is None:
        # TODO:
        # - check if emulator process is already running and kill it if so
        # - detect if Popen process starts without error (if udp port is listening)
        # - run custom firmware
        # - run T1 emulator
        # - run T1 & T2 emulator at once
        # - run two T2/T1 emulators
        print(os.getcwd())
        proc = Popen(
            command,
            shell=True,
            preexec_fn=os.setsid
        )
        print("the commandline is {}".format(proc.args))


def wait_for_bridge_device():
    start = time.monotonic()
    timeout = 5
    while True:
        try:
            device = get_bridge_device()
            return device
        except:
            elapsed = time.monotonic() - start
            if elapsed >= timeout:
                print("timed out waiting for bridge device")
                raise RuntimeError("timed out waiting for bridge device.")
            time.sleep(0.05)


def wait_for_udp_device():
    start = time.monotonic()
    timeout = 5
    while True:
        try:
            device = get_udp_device()
            return device
        except:
            elapsed = time.monotonic() - start
            if elapsed >= timeout:
                print("timed out udp device")
                raise RuntimeError("Timed out waiting for udp device.")
            time.sleep(0.05)


def get_device():
    path = os.environ.get("TREZOR_PATH")
    interact = int(os.environ.get("INTERACT", 0))
    timeout = 5
    start = time.monotonic()

    if path:
        try:
            transport = get_transport(path)
            return TrezorClientDebugLink(transport, auto_interact=not interact)
        except Exception as e:
            raise RuntimeError("Failed to open debuglink for {}".format(path)) from e

    else:
        while True:
            try:
                devices = enumerate_devices()
                for device in devices:
                    try:
                        return TrezorClientDebugLink(device, auto_interact=not interact)
                    except Exception:
                        pass
                else:
                    raise RuntimeError("No debuggable device found")
            except: 
                elapsed = time.monotonic() - start
                if elapsed >= timeout:
                    raise RuntimeError("No debuggable device found")
                time.sleep(0.05)


def get_bridge_device():
    devices = BridgeTransport.enumerate()
    print(devices)
    for d in devices:
        debugBridge = d.find_debug()

        return d
    raise RuntimeError("No debuggable bridge device found")



def stop():
    global proc
    if proc is not None:
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        proc = None


def setup_device(mnemonic, pin, passphrase_protection, label):
    # TODO:
    # - "path" parameter to work with correct device
    # - check if device is acquired otherwise throws "wrong previous session" from bridge
    client = get_device()
    client.open()
    wipe(client)
    time.sleep(1)
    # matejcik: dost casto mi to hangne po wipe() a load_device_by_mnemonic(), ty sleeps se zda pomahaji ale ne na 100%.
    # pokud neni bridge zapnuty, tak vse funguje vzdy
    debuglink.load_device_by_mnemonic(
        client, mnemonic=mnemonic, pin=pin, passphrase_protection=passphrase_protection, label=label)
    time.sleep(1)
    client.close()


def wipe_device():
    client = get_device()
    client.open()
    wipe(client)
    client.close()


def decision():
    # matejcik: delam v testech backup devicu. ze suity jej zahajim a ted ho tady potrebuju odklikat na devicu. 
    # pokud poslu press_yes timto zpusobem, tak okamzite dostanu backup failed
    device = get_device()
    device.open()
    device.debug.press_yes()
    device.close()

    # matejcik: pokud to poslu takto, tak vse funguje, device mi odpovi jak ocekavam.
    transport = get_bridge_device()
    print(transport)
    client = DebugLink(transport.find_debug())

    client.open()
    time.sleep(0.6)
    client.press_yes()
    client.close()

# enter recovery word or pin
# enter pin not possible for T2, it is locked, for T1 it is possible
# change pin possible, use input(word=pin-string)
def input(word):
    device = get_device()
    device.open()
    device.debug.input(word)
    device.close()


def swipe(direction): 
    device = get_device()
    device.open()
    if direction == 'up':
        device.debug.swipe_up()
    elif direction == 'right':
        device.debug.swipe_right()
    elif direction == 'down':
        device.debug.swipe_down()
    elif direction == 'left':
        device.debug.swipe_left()
    device.close()


def read_and_confirm_mnemonic():
    device = get_device()
    device.open()
    mnem = device.debug.read_mnemonic_secret().decode("utf-8")
    mnemonic = mnem.split()
    device.debug.swipe_up()
    device.debug.swipe_up()
    device.debug.swipe_up()
    device.debug.press_yes()
    index = device.debug.read_reset_word_pos()
    device.debug.input(mnemonic[index])
    index = device.debug.read_reset_word_pos()
    device.debug.input(mnemonic[index])
    index = device.debug.read_reset_word_pos()
    device.debug.input(mnemonic[index])
    time.sleep(1)
    device.debug.press_yes()
    time.sleep(1)
    device.debug.press_yes()
    device.close()


def select_num_of_words(num_of_words=12):
    device = get_device()
    device.open()
    device.debug.input(str(num_of_words))
    device.close()


def set_passphrase_source(passphrase_source):
    device = get_device()
    device.open()
    time.sleep(0.6)
    device.apply_settings(device, passphrase_source=passphrase_source)
    device.close()
