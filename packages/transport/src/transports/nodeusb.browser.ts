import {
    AbstractTransport,
    type AbstractTransportParams,
    TRANSPORT_ERROR as ERRORS,
    empty,
    emptySync,
} from '@trezor/transport-common';

// Environment stub — browser build.
//
// Why this file exists: `@trezor/connect/src/device/TransportList.ts` performs
// a static `import { NodeUsbTransport } from '@trezor/transport'` so that the
// barrel can switch on a transport-name string at runtime. The real
// implementation (`./nodeusb.ts`) imports the `usb` package, a native N-API
// binding with top-level CJS side effects that cannot be resolved in a
// browser bundle — without this stub any browser consumer of `@trezor/connect`
// would fail at build time on the `usb` import.
//
// How the redirect works: `packages/transport/package.json` declares a
// `browser` field that maps `./src/transports/nodeusb` to this file (and the
// `publishConfig.browser` field does the same for the published `./libESM/`
// output). Webpack, Vite, esbuild, and other bundlers honor this field, so
// browser targets swap in this no-op and `usb` never enters the dependency
// graph.
//
// Runtime behavior: every method is a no-op (`empty` / `emptySync`) and the
// constructor logs `WRONG_ENVIRONMENT` so any accidental instantiation in a
// browser is loud and obvious. Browser hosts are expected to pick
// `WebUsbTransport` (from `@trezor/transport-web`) or `BridgeTransport`
// (HTTP-based) instead — `NodeUsbTransport` is a Node-only choice.
//
// Removal path: tracked in #27110 (composition-root / pure-DI refactor). Once
// `TransportList.ts` no longer statically imports concrete transport classes
// and instead receives them via DI from each host app, the bundler will never
// see `NodeUsbTransport` in a browser build and this stub becomes redundant.

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
