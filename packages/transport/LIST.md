SUITE / CONNECT_POPUP

-   new UI for pairing, and thp button requests

CONNECT:

-   detect bridge version vs. trezor-host-protocol setup, it will not work with 2.0
-   warn before potential update which may break future compatibility (update old firmware to thp firmware using bridge 2)
-   Device object changes:
    -   transportState: { channel, syncBitRead, syncBitWrite, pairingCredentials, sessionId }
    -   properties (partial Features)
-   Multi-transport: transportState as array - each "transport medium/api" have own state
-   Create new DEVICE_EVENT => extension of DEVICE.TRANSPORT_STATE_CHANGE/UPDATE
-   Dispatch new event on each transportState change
-   DeviceList transport enable/disable
-   DeviceList not null in core

TRANSPORT:

-   readUtil, validate received chunk, ignore unexpected or do the retransmission
-   readUtil, retransmission on unexpected message or timeout - timeout optional for cases like app layer ButtonRequest in Backup process)
-   validate crc step

BRIDGE:

-   receive more info from api requests: protocol, expectedState,... (query? request.header? new endpoint? )
-   use readUtil + expectedState logic

PROTOBUF:git c

-   union of THP types and generic protobuf MessageType
