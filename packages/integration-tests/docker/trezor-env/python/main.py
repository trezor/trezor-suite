import sys
import os
import json
import atexit
from termcolor import colored

from websocket_server import WebsocketServer
import emulator
import bridge


def cleanup():
    emulator.stop()
    bridge.stop()


atexit.register(cleanup)

# Called for every client connecting (after handshake)


def new_client(client, server):
    welcome = json.dumps({"type": "client", "id": client['id']})
    server.send_message_to_all(welcome)

# Called for every client disconnecting


def client_left(client, server):
    print(colored("Client(%d) disconnected" % client['id'], "blue"))

# Called when a client sends a message


def message_received(client, server, message):
    print("Client(%d) request: %s" % (client['id'], message))
    try:
        cmd = json.loads(message)
    except:
        server.send_message(client, json.dumps(
            {"success": False, "error": "Invalid json message"}))
        return

    cmdId = cmd["id"]
    cmdType = cmd["type"]
    
    response = None
    try:
        if cmdType == "ping":
            server.send_message(client, "pong")
        elif cmdType == "emulator-start":
            version = cmd.get("version") or "2.1.4" 
            emulator.start(version)
            response = {"success": True}
        elif cmdType == "emulator-stop":
            emulator.stop()
            response = {"success": True}
        elif cmdType == "emulator-setup":
            emulator.setup_device(
                cmd["mnemonic"], cmd["pin"], cmd["passphrase_protection"], cmd["label"])
            response = {"success": True}
        elif cmdType == "emulator-decision":
            emulator.decision()
            response = {"success": True}
        elif cmdType == "emulator-input":
            emulator.input(cmd['word'])
            response = {"success": True}
        elif cmdType == "emulator-read-and-confirm-mnemonic":
            emulator.read_and_confirm_mnemonic()
            response = {"success": True}
        elif cmdType == "select-num-of-words":
            emulator.select_num_of_words(cmd['num'])
            response = {"success": True}
        elif cmdType == "emulator-swipe":
            emulator.swipe(cmd["direction"])
            response = {"success": True}
        elif cmdType == "emulator-wipe":
            emulator.wipe_device()
            response = {"success": True}
        elif cmdType == "emulator-set-passhphrase-source":
            emulator.set_passphrase_source(cmd['passphrase_source'])
            response = {"success": True}
        elif cmdType == "bridge-start":
            bridge.start()
            response = {"success": True}
        elif cmdType == "bridge-stop":
            bridge.stop()
            response = {"success": True}
        elif cmdType == "exit":
            emulator.stop()
            bridge.stop()
            os._exit(1)
        print("Client(%d) response: %s" % (client['id'], str(response)))
        if response is not None:
            server.send_message(client, json.dumps(
                dict(response, id=cmdId, success=True)))
    except Exception as e:
        print("Client(%d) response: %s" % (client['id'], str(e)))
        server.send_message(client, json.dumps(
            {"id": cmdId, "success": False, "error": str(e)}))


server = WebsocketServer(9001)
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.set_fn_message_received(message_received)
server.run_forever()
