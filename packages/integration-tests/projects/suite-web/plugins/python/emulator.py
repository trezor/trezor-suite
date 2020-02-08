import sys
import os
import signal
import time
from subprocess import Popen

from trezorlib import device, debuglink, log
from trezorlib.debuglink import DebugLink, TrezorClientDebugLink
from trezorlib.client import TrezorClient
from trezorlib.transport import enumerate_devices, get_transport
from trezorlib.transport.udp import UdpTransport
from trezorlib.transport.bridge import BridgeTransport
from trezorlib import messages as proto

proc = None
# log.enable_debug_output()


def start():
    global proc
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
            # todo: run from binary directly, need to solve glibc error;

            # "./emu.sh",
            # cwd="../../../trezor-firmware/core"


            # "TREZOR_OLED_SCALE=2 ./packages/suite-web/test/trezor-emu-legacy-v1.6.2 -O0",
            "./projects/suite-web/plugins/python/bin/trezor-emu-core-v2.1.4 -O0 -X heapsize=20M -m main",
            shell=True,
            preexec_fn=os.setsid
        )
        print("the commandline is {}".format(proc.args))

        time.sleep(3)  # replace this with "wait_for_emulator" process


def stop():
    global proc
    if proc is not None:
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        proc = None


def get_udp_device():
    devices = UdpTransport.enumerate()
    for d in devices:
        # debugBridge = d.find_debug()
        return d
    raise RuntimeError("No debuggable udp device found")


def get_bridge_device():
    devices = BridgeTransport.enumerate()
    print(devices)
    for d in devices:
        debugBridge = d.find_debug()

        return d
    raise RuntimeError("No debuggable bridge device found")


def setup_device(mnemonic, pin, passphrase_protection, label):
    # Setup link
    # transport = get_udp_device()
    # TODO:
    # - "path" parameter to work with correct device
    # - check if device is acquired otherwise throws "wrong previous session" from bridge
    transport = get_bridge_device()
    print(transport)
    client = TrezorClientDebugLink(transport)
    client.open()
    device.wipe(client)
    debuglink.load_device_by_mnemonic(
        client, mnemonic=mnemonic, pin=pin, passphrase_protection=passphrase_protection, label=label)
    client.close()
    # time.sleep(1)


def wipe_device():
    transport = get_bridge_device()
    print(transport)
    client = TrezorClientDebugLink(transport)
    client.open()
    device.wipe(client)
    client.close()


def decision():
    # TODO:
    # - "path" parameter to work with correct device, keep transport with device
    # Setup link
    transport = get_bridge_device()
    print(transport)
    client = DebugLink(transport.find_debug())

    client.open()
    time.sleep(0.6)  # trezord needs time to populate changes
    client.press_yes()
    client.close()

def input(word):
    transport = get_bridge_device()
    print(transport)
    client = DebugLink(transport.find_debug())

    client.open()
    time.sleep(0.6)  # trezord needs time to populate changes
    client.input(word)
    client.close()

def swipe(direction): 
    transport = get_bridge_device()
    print(transport)
    client = DebugLink(transport.find_debug())
    client.open()
    time.sleep(0.6)  # trezord needs time to populate changes
    if direction == 'up':
        client.swipe_up()
    elif direction == 'right':
        client.swipe_right()
    elif direction == 'down':
        client.swipe_down();
    elif direction == 'left':
        client.swipe_left()
    client.close()
    
def read_and_confirm_mnemonic():
    transport = get_bridge_device()
    print(transport)
    client = DebugLink(transport.find_debug())
    client.open()
    time.sleep(0.6)  # trezord needs time to populate changes
    mnem = client.read_mnemonic_secret().decode("utf-8")
    mnemonic = mnem.split()
    client.swipe_up()
    client.swipe_up()
    client.swipe_up()
    client.press_yes()
    time.sleep(1)
    index = client.read_reset_word_pos()
    client.input(mnemonic[index])
    time.sleep(1)
    index = client.read_reset_word_pos()
    client.input(mnemonic[index])
    time.sleep(1)
    index = client.read_reset_word_pos()
    client.input(mnemonic[index])
    time.sleep(1)
    client.press_yes()
    time.sleep(1)
    client.press_yes()
    client.close()

# todo: work in progress
# def enter_pin(pin):
#     transport = get_bridge_device()
#     print(transport)
#     client = DebugLink(transport.find_debug())

#     client.open()
#     time.sleep(0.6)  # trezord needs time to populate changes
#     # pin = client.read_pin()
#     pin_encoded = client.encode_pin("1234")
#     time.sleep(1)

#     ret = client.call_raw(proto.PinMatrixAck(pin=pin_encoded))
#     print(ret)
#     time.sleep(1)
#     print('pin')
#     print(pin)
#     client.close()
