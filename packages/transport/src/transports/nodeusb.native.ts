import {
    AbstractTransport,
    type AbstractTransportParams,
    TRANSPORT_ERROR as ERRORS,
    empty,
    emptySync,
} from '@trezor/transport-common';

// Environment stub — React Native build.
//
// Why this file exists: `@trezor/connect/src/device/TransportList.ts` performs
// a static `import { NodeUsbTransport } from '@trezor/transport'` so that the
// barrel can switch on a transport-name string at runtime. The real
// implementation (`./nodeusb.ts`) imports the `usb` package, a Node-only
// N-API binding that does not exist on React Native — without this stub any
// RN consumer of `@trezor/connect` would fail at Metro bundle time on the
// `usb` import.
//
// How the redirect works: `packages/transport/package.json` declares a
// `react-native` field that maps `./src/transports/nodeusb` to this file
// (and the `publishConfig.react-native` field does the same for the
// published `./libESM/` output). Metro honors this field, so RN targets
// swap in this no-op and `usb` never enters the dependency graph.
//
// Runtime behavior: every method is a no-op (`empty` / `emptySync`) and the
// constructor logs `WRONG_ENVIRONMENT` so any accidental instantiation in
// React Native is loud and obvious. RN hosts in `suite-native` use
// `BridgeTransport` (HTTP-based) or a native HID/USB transport supplied via
// the `transports` array — `NodeUsbTransport` is a Node-only choice.
//
// Removal path: tracked in #27110 (composition-root / pure-DI refactor). Once
// `TransportList.ts` no longer statically imports concrete transport classes
// and instead receives them via DI from each host app, Metro will never see
// `NodeUsbTransport` in an RN build and this stub becomes redundant.

export class NodeUsbTransport extends AbstractTransport {
    public name = 'NodeUsbTransport' as const;

    constructor(params: AbstractTransportParams) {
        super(params);
        console.error(ERRORS.WRONG_ENVIRONMENT);
    }

    init = empty;
    acquire = empty;
    enumerate = empty;
    call = empty;
    receive = empty;
    send = empty;
    release = empty;
    releaseDevice = empty;
    listen = emptySync;

    stop() {
        super.stop();
    }

    releaseSync() {}
}
