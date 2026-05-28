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
// a static `import { UdpTransport } from '@trezor/transport'` so that the
// barrel can switch on a transport-name string at runtime. The real
// implementation (`./udp.ts`) imports Node's built-in `dgram` module, which
// does not exist in React Native — without this stub any RN consumer of
// `@trezor/connect` would fail at Metro bundle time on the `dgram` import.
//
// How the redirect works: `packages/transport/package.json` declares a
// `react-native` field that maps `./src/transports/udp` to this file (and the
// `publishConfig.react-native` field does the same for the published
// `./lib/` output). Metro honors this field, so RN targets swap in this
// no-op and `dgram` never enters the dependency graph.
//
// Runtime behavior: every method is a no-op (`empty` / `emptySync`) and the
// constructor logs `WRONG_ENVIRONMENT` so any accidental instantiation in
// React Native is loud and obvious. `UdpTransport` exists only to talk to
// the Trezor emulator during local development and tests; production
// `suite-native` hosts never select it.
//
// Removal path: tracked in #27110 (composition-root / pure-DI refactor). Once
// `TransportList.ts` no longer statically imports concrete transport classes
// and instead receives them via DI from each host app, Metro will never see
// `UdpTransport` in an RN build and this stub becomes redundant.

export class UdpTransport extends AbstractTransport {
    public name = 'UdpTransport' as const;

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
