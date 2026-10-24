"""
Emulated Bluetooth LE environment for trezor-bluetooth e2e tests.

Uses Bumble (https://github.com/google/bumble) to run, in a single process:
  - a virtual controller exposed to the Linux kernel through /dev/vhci. BlueZ sees it as an adapter
    and trezor-bluetooth (the "central") talks to it through bluetoothd as it would with real hardware.
  - any number of mock peripherals (see peripheral.py) on virtual controllers sharing the same radio link.
  - a JSON-RPC over HTTP control API (POST /rpc {"method": ..., "params": {...}}) to change the
    environment at runtime: add/remove peripherals, change advertisements, toggle the central adapter,
    configure pairing, drop connections.

A "trezor" peripheral tunnels its GATT traffic to the Trezor emulator UDP port (udpTarget),
or echoes it when no target is set.
"""

import asyncio
import logging
import os
import pathlib

from aiohttp import web
from bumble.controller import Controller
from bumble.keys import MemoryKeyStore
from bumble.link import LocalLink
from bumble.transport import open_transport

from peripheral import MockPeripheral, patch_le_acl_source_address

CENTRAL_ADDRESS = os.environ.get("MOCK_CENTRAL_ADDRESS", "00:00:00:E2:E0:01")
DEFAULT_PERIPHERAL_ADDRESS = os.environ.get("MOCK_PERIPHERAL_ADDRESS", "F0:E2:E0:00:00:02")
DEFAULT_PERIPHERAL_NAME = os.environ.get("MOCK_PERIPHERAL_NAME", "Trezor E2E")
DEFAULT_UDP_TARGET = os.environ.get("MOCK_UDP_TARGET")
CONTROL_PORT = int(os.environ.get("MOCK_CONTROL_PORT", "21398"))
READY_FILE = pathlib.Path(os.environ.get("MOCK_READY_FILE", "/tmp/mock_trezor.ready"))
CENTRAL_ADAPTER_FILE = pathlib.Path(
    os.environ.get("MOCK_CENTRAL_ADAPTER_FILE", "/tmp/mock_central_adapter")
)

DEFAULT_PERIPHERAL_ID = "trezor"

logger = logging.getLogger("ble_emulator")


class ControlError(Exception):
    pass


async def run(*args: str) -> tuple[int, str]:
    process = await asyncio.create_subprocess_exec(
        *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
    )
    output, _ = await process.communicate()

    return process.returncode or 0, output.decode().strip()


class Emulator:
    def __init__(self, link: LocalLink):
        self.link = link
        self.peripherals: dict[str, MockPeripheral] = {}
        self.known_addresses: set[str] = set()
        # bonds outlive a peripheral instance, like on a real device (keyed by address)
        self.keystores: dict[str, MemoryKeyStore] = {}
        self.next_address_index = 3

    # --- helpers

    def _peripheral(self, params: dict) -> MockPeripheral:
        peripheral = self.peripherals.get(params.get("id", ""))
        if not peripheral:
            raise ControlError(f"unknown peripheral: {params.get('id')}")

        return peripheral

    def _next_address(self) -> str:
        address = f"F0:E2:E0:00:00:{self.next_address_index:02X}"
        self.next_address_index += 1

        return address

    def _central_adapter(self) -> str:
        if CENTRAL_ADAPTER_FILE.exists():
            return CENTRAL_ADAPTER_FILE.read_text().strip()

        return "hci0"

    # --- RPC methods

    async def add_peripheral(self, params: dict) -> dict:
        kind = params.get("kind", "trezor")
        id = params.get("id") or f"{kind}-{len(self.peripherals) + 1}"
        if id in self.peripherals:
            raise ControlError(f"peripheral already exists: {id}")

        is_default = id == DEFAULT_PERIPHERAL_ID
        address = params.get("address") or (
            DEFAULT_PERIPHERAL_ADDRESS if is_default else self._next_address()
        )
        peripheral = MockPeripheral(
            self.link,
            id=id,
            address=address,
            kind=kind,
            name=params.get("name") or (DEFAULT_PERIPHERAL_NAME if is_default else id),
            manufacturer_data=params.get("manufacturerData"),
            service_uuids=params.get("serviceUuids"),
            connectable=params.get("connectable", True),
            udp_target=params.get("udpTarget", DEFAULT_UDP_TARGET),
            keystore=self.keystores.setdefault(address, MemoryKeyStore()),
        )
        await peripheral.start(advertise=params.get("advertising", True))
        self.peripherals[id] = peripheral
        self.known_addresses.add(address)

        return peripheral.describe()

    async def remove_peripheral(self, params: dict) -> None:
        peripheral = self._peripheral(params)
        await peripheral.stop()
        del self.peripherals[peripheral.id]

    async def start_advertising(self, params: dict) -> dict:
        peripheral = self._peripheral(params)
        await peripheral.start_advertising()

        return peripheral.describe()

    async def stop_advertising(self, params: dict) -> dict:
        peripheral = self._peripheral(params)
        await peripheral.stop_advertising()

        return peripheral.describe()

    async def update_peripheral(self, params: dict) -> dict:
        peripheral = self._peripheral(params)
        await peripheral.update(
            name=params.get("name"),
            manufacturer_data=params.get("manufacturerData"),
            service_uuids=params.get("serviceUuids"),
            connectable=params.get("connectable"),
        )

        return peripheral.describe()

    async def disconnect_peripheral(self, params: dict) -> None:
        await self._peripheral(params).disconnect()

    async def set_pairing(self, params: dict) -> dict:
        peripheral = self._peripheral(params)
        if "accept" in params:
            peripheral.pairing.accept = bool(params["accept"])
        if "delayMs" in params:
            peripheral.pairing.delay_ms = int(params["delayMs"])

        return peripheral.describe()

    async def forget_bonds(self, params: dict) -> None:
        await self._peripheral(params).forget_bonds()

    async def set_central_power(self, params: dict) -> None:
        powered = "true" if params.get("enabled", True) else "false"
        code, output = await run(
            "busctl", "--system", "set-property", "org.bluez",
            f"/org/bluez/{self._central_adapter()}", "org.bluez.Adapter1", "Powered", "b", powered,
        )  # fmt: skip
        if code != 0:
            raise ControlError(f"set Powered failed: {output}")

    async def forget_central_devices(self, _params: dict | None = None) -> None:
        """Remove devices cached by BlueZ and the matching peripheral bonds, so both sides are unpaired."""
        for keystore in self.keystores.values():
            await keystore.delete_all()
        adapter = self._central_adapter()
        for address in self.known_addresses:
            path = f"/org/bluez/{adapter}/dev_{address.replace(':', '_')}"
            await run(
                "busctl", "--system", "call", "org.bluez", f"/org/bluez/{adapter}",
                "org.bluez.Adapter1", "RemoveDevice", "o", path,
            )  # fmt: skip

    async def wait_central_device(self, params: dict) -> None:
        """Wait until BlueZ (re)creates the device object of the peripheral. Requires an active scan."""
        peripheral = self._peripheral(params)
        adapter = self._central_adapter()
        path = f"/org/bluez/{adapter}/dev_{peripheral.address.replace(':', '_')}"
        deadline = asyncio.get_running_loop().time() + params.get("timeoutMs", 10000) / 1000
        while True:
            code, _ = await run(
                "busctl", "--system", "get-property", "org.bluez", path, "org.bluez.Device1", "Address",
            )  # fmt: skip
            if code == 0:
                return
            if asyncio.get_running_loop().time() > deadline:
                raise ControlError(f"BlueZ did not discover {peripheral.id}")
            await asyncio.sleep(0.2)

    async def list_peripherals(self, _params: dict | None = None) -> list[dict]:
        return [peripheral.describe() for peripheral in self.peripherals.values()]

    async def reset(self, params: dict | None = None) -> list[dict]:
        """
        Back to the initial state: central powered on, only the default Trezor peripheral.
        forgetDevices: also remove devices (and bonds) cached by BlueZ. The server keeps its own cache
        and does not notice the removal until BlueZ discovers the device again.
        """
        for id in list(self.peripherals):
            await self.remove_peripheral({"id": id})
        if (params or {}).get("forgetDevices"):
            await self.forget_central_devices()
        await self.set_central_power({"enabled": True})
        await self.add_peripheral({"id": DEFAULT_PERIPHERAL_ID})

        return await self.list_peripherals()


def create_control_app(emulator: Emulator) -> web.Application:
    async def rpc(request: web.Request) -> web.Response:
        try:
            body = await request.json()
            method = body["method"]
            handler = getattr(emulator, method, None)
            if method.startswith("_") or not asyncio.iscoroutinefunction(handler):
                raise ControlError(f"unknown method: {method}")
            result = await handler(body.get("params") or {})

            return web.json_response({"result": result})
        except (ControlError, KeyError, ValueError, TypeError) as error:
            logger.warning("control error: %r", error)

            return web.json_response({"error": str(error) or repr(error)}, status=400)

    app = web.Application()
    app.add_routes([web.post("/rpc", rpc), web.get("/health", lambda _r: web.Response(text="ok"))])

    return app


async def main():
    patch_le_acl_source_address()
    link = LocalLink()

    # central side: bridge the kernel (VHCI) to a virtual controller
    vhci = await open_transport("vhci")
    Controller(
        "central",
        host_source=vhci.source,
        host_sink=vhci.sink,
        link=link,
        public_address=CENTRAL_ADDRESS,
    )

    emulator = Emulator(link)
    await emulator.add_peripheral({"id": DEFAULT_PERIPHERAL_ID})

    runner = web.AppRunner(create_control_app(emulator))
    await runner.setup()
    await web.TCPSite(runner, "127.0.0.1", CONTROL_PORT).start()

    READY_FILE.touch()
    logger.info("BLE emulator ready, control API on 127.0.0.1:%d", CONTROL_PORT)

    await vhci.source.terminated


if __name__ == "__main__":
    logging.basicConfig(level=os.environ.get("MOCK_LOG_LEVEL", "INFO"))
    asyncio.run(main())
