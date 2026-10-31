"""Mock BLE peripherals (Trezor and generic) running on a Bumble virtual controller."""

import asyncio
import logging
from collections.abc import Callable
from dataclasses import dataclass

from bumble.controller import Controller
from bumble.core import AdvertisingData, PhysicalTransport, UUID
from bumble.device import AdvertisingType, Device
from bumble.gatt import (
    GATT_BATTERY_LEVEL_CHARACTERISTIC,
    GATT_BATTERY_SERVICE,
    Characteristic,
    CharacteristicValue,
    Service,
)
from bumble.hci import Address, OwnAddressType
from bumble.host import Host
from bumble.keys import KeyStore
from bumble.link import LocalLink
from bumble.pairing import PairingConfig, PairingDelegate

# trezor-firmware BT_UUID_TRZ_*, see packages/transport-bluetooth/src/server/device.rs
SERVICE_UUID = "8c000001-a59b-4d58-a9ad-073df69fa1b1"
CHARACTERISTIC_RX = "8c000002-a59b-4d58-a9ad-073df69fa1b1"
CHARACTERISTIC_TX = "8c000003-a59b-4d58-a9ad-073df69fa1b1"
CHARACTERISTIC_PUSH_NOTIFICATION = "8c000004-a59b-4d58-a9ad-073df69fa1b1"

TREZOR_COMPANY_ID = 0x0F29

logger = logging.getLogger("peripheral")

PacketHandler = Callable[[bytes], None]


def patch_le_acl_source_address() -> None:
    """Bumble's LocalLink always uses the sender's random address as the LE ACL source, but receivers key
    connections by the address actually used in the connection (public here)."""

    def send_acl_data(self, sender_controller, destination_address, transport, data):
        if transport != PhysicalTransport.LE:
            return original_send_acl_data(
                self, sender_controller, destination_address, transport, data
            )

        destination_controller = self.find_le_controller(destination_address)
        connection = sender_controller.le_connections.get(destination_address)
        if destination_controller is None or connection is None:
            return

        asyncio.get_running_loop().call_soon(
            lambda: destination_controller.on_link_acl_data(
                connection.self_address, transport, data
            )
        )

    original_send_acl_data = LocalLink.send_acl_data
    LocalLink.send_acl_data = send_acl_data


class EchoBackend:
    def __init__(self):
        self.on_packet: PacketHandler = lambda _data: None

    async def start(self) -> None:
        pass

    def send(self, data: bytes) -> None:
        self.on_packet(data)


class UdpTunnel(asyncio.DatagramProtocol):
    """Forwards packets 1:1 between the BLE characteristics and the Trezor emulator UDP port."""

    def __init__(self, target: tuple[str, int]):
        self.target = target
        self.transport: asyncio.DatagramTransport | None = None
        self.on_packet: PacketHandler = lambda _data: None

    async def start(self) -> None:
        await asyncio.get_running_loop().create_datagram_endpoint(
            lambda: self, remote_addr=self.target
        )
        logger.info("UDP tunnel to %s:%d", *self.target)

    def connection_made(self, transport) -> None:
        self.transport = transport

    def datagram_received(self, data: bytes, _addr) -> None:
        logger.debug("udp -> ble %d bytes", len(data))
        self.on_packet(data)

    def error_received(self, exc) -> None:
        logger.warning("UDP error: %s", exc)

    def send(self, data: bytes) -> None:
        logger.debug("ble -> udp %d bytes", len(data))
        if self.transport:
            self.transport.sendto(data)

    def close(self) -> None:
        if self.transport:
            self.transport.close()


def create_backend(udp_target: str | None) -> EchoBackend | UdpTunnel:
    if not udp_target:
        return EchoBackend()
    host, _, port = udp_target.rpartition(":")

    return UdpTunnel((host or "127.0.0.1", int(port)))


@dataclass
class PairingBehavior:
    accept: bool = True
    delay_ms: int = 0


class ConfigurableDelegate(PairingDelegate):
    """Trezor displays a numeric comparison code. The mock confirms or rejects it as configured."""

    def __init__(self, behavior: PairingBehavior):
        super().__init__(io_capability=PairingDelegate.DISPLAY_OUTPUT_AND_YES_NO_INPUT)
        self.behavior = behavior

    async def compare_numbers(self, number: int, digits: int) -> bool:
        logger.info(
            "pairing numeric comparison %0*d (accept=%s, delay=%dms)",
            digits,
            number,
            self.behavior.accept,
            self.behavior.delay_ms,
        )
        await asyncio.sleep(self.behavior.delay_ms / 1000)

        return self.behavior.accept


def create_trezor_services(device: Device, backend: EchoBackend | UdpTunnel) -> list[Service]:
    last_packet = bytearray()

    def on_backend_packet(data: bytes):
        last_packet[:] = data
        asyncio.create_task(device.notify_subscribers(tx, data))

    def on_rx_write(_connection, value: bytes):
        backend.send(bytes(value))

    backend.on_packet = on_backend_packet

    rx = Characteristic(
        CHARACTERISTIC_RX,
        Characteristic.Properties.WRITE | Characteristic.Properties.WRITE_WITHOUT_RESPONSE,
        Characteristic.WRITEABLE,
        CharacteristicValue(write=on_rx_write),
    )
    tx = Characteristic(
        CHARACTERISTIC_TX,
        Characteristic.Properties.READ | Characteristic.Properties.NOTIFY,
        Characteristic.READABLE,
        CharacteristicValue(read=lambda _connection: bytes(last_packet)),
    )
    push_notification = Characteristic(
        CHARACTERISTIC_PUSH_NOTIFICATION,
        Characteristic.Properties.READ | Characteristic.Properties.NOTIFY,
        Characteristic.READABLE,
        bytes([0]),
    )
    battery_level = Characteristic(
        GATT_BATTERY_LEVEL_CHARACTERISTIC,
        Characteristic.Properties.READ | Characteristic.Properties.NOTIFY,
        Characteristic.READABLE,
        bytes([100]),
    )

    return [
        Service(SERVICE_UUID, [rx, tx, push_notification]),
        Service(GATT_BATTERY_SERVICE, [battery_level]),
    ]


class MockPeripheral:
    """
    kind "trezor": Trezor GATT services, advertises the Trezor service UUID and manufacturer data.
    kind "generic": no GATT services, advertises only the name (a "serviceless" peripheral).
    """

    def __init__(
        self,
        link: LocalLink,
        id: str,
        address: str,
        kind: str = "trezor",
        name: str = "Trezor E2E",
        manufacturer_data: list[int] | None = None,
        service_uuids: list[str] | None = None,
        connectable: bool = True,
        udp_target: str | None = None,
        keystore: KeyStore | None = None,
    ):
        if kind not in ("trezor", "generic"):
            raise ValueError(f"unknown peripheral kind: {kind}")

        is_trezor = kind == "trezor"
        self.id = id
        self.kind = kind
        self.address = address
        self.name = name
        # pairing mode, device color, device code
        # see BluetoothDevice.data in packages/transport-bluetooth/src/client/types.ts
        self.manufacturer_data = (
            manufacturer_data if manufacturer_data is not None else ([1, 0, 0] if is_trezor else [])
        )
        self.service_uuids = (
            service_uuids if service_uuids is not None else ([SERVICE_UUID] if is_trezor else [])
        )
        self.connectable = connectable
        self.advertising = False
        self.pairing = PairingBehavior()

        self.controller = Controller(id, link=link, public_address=address)
        self.link = link
        self.device = Device(
            name=name,
            address=Address(address, Address.PUBLIC_DEVICE_ADDRESS),
            host=Host(controller_source=self.controller, controller_sink=self.controller),
        )
        self.device.pairing_config_factory = lambda _connection: PairingConfig(
            sc=True, mitm=True, bonding=True, delegate=ConfigurableDelegate(self.pairing)
        )
        if keystore is not None:
            self.device.keystore = keystore

        self.backend = create_backend(udp_target) if is_trezor else None
        if self.backend:
            for service in create_trezor_services(self.device, self.backend):
                self.device.add_service(service)

        self.device.on(
            "connection", lambda c: logger.info("%s: connected %s", self.id, c.peer_address)
        )
        self.device.on("disconnection", lambda c, reason: logger.info("%s: disconnected", self.id))

    def _advertising_data(self) -> bytes:
        structures = [(AdvertisingData.COMPLETE_LOCAL_NAME, self.name.encode())]
        if self.service_uuids:
            structures.append(
                (
                    AdvertisingData.COMPLETE_LIST_OF_128_BIT_SERVICE_CLASS_UUIDS,
                    b"".join(bytes(UUID(uuid)) for uuid in self.service_uuids),
                )
            )
        if self.manufacturer_data:
            structures.append(
                (
                    AdvertisingData.MANUFACTURER_SPECIFIC_DATA,
                    TREZOR_COMPANY_ID.to_bytes(2, "little") + bytes(self.manufacturer_data),
                )
            )

        return bytes(AdvertisingData(structures))

    async def start(self, advertise: bool = True) -> None:
        if self.backend:
            await self.backend.start()
        await self.device.power_on()
        if advertise:
            await self.start_advertising()

    async def start_advertising(self) -> None:
        if self.advertising:
            await self.device.stop_advertising()
        await self.device.start_advertising(
            advertising_type=(
                AdvertisingType.UNDIRECTED_CONNECTABLE_SCANNABLE
                if self.connectable
                else AdvertisingType.UNDIRECTED
            ),
            own_address_type=OwnAddressType.PUBLIC,
            auto_restart=True,
            advertising_data=self._advertising_data(),
        )
        self.advertising = True

    async def stop_advertising(self) -> None:
        await self.device.stop_advertising()
        self.advertising = False

    async def update(
        self,
        name: str | None = None,
        manufacturer_data: list[int] | None = None,
        service_uuids: list[str] | None = None,
        connectable: bool | None = None,
    ) -> None:
        if name is not None:
            self.name = name
        if manufacturer_data is not None:
            self.manufacturer_data = manufacturer_data
        if service_uuids is not None:
            self.service_uuids = service_uuids
        if connectable is not None:
            self.connectable = connectable
        if self.advertising:
            await self.start_advertising()

    async def disconnect(self) -> None:
        for connection in list(self.device.connections.values()):
            await connection.disconnect()

    async def forget_bonds(self) -> None:
        if self.device.keystore:
            await self.device.keystore.delete_all()

    async def stop(self) -> None:
        await self.disconnect()
        if self.advertising:
            await self.stop_advertising()
        await self.device.power_off()
        self.link.remove_controller(self.controller)
        if isinstance(self.backend, UdpTunnel):
            self.backend.close()

    def describe(self) -> dict:
        return {
            "id": self.id,
            "kind": self.kind,
            "name": self.name,
            "address": self.address,
            "manufacturerData": self.manufacturer_data,
            "serviceUuids": self.service_uuids,
            "connectable": self.connectable,
            "advertising": self.advertising,
            "connected": len(self.device.connections) > 0,
            "pairing": {"accept": self.pairing.accept, "delayMs": self.pairing.delay_ms},
        }
