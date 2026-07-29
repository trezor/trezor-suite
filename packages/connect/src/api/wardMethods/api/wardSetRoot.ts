import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { createRawWardMethod } from '../rawWardMethod';

export default createRawWardMethod({
    name: 'wardSetRoot',
    // WardSetRoot was absorbed into the WARD sync round (WARDMergeState). The only
    // remaining single-call root install is the DEBUG-ONLY unauthenticated injection
    // WARDDebugSetRoot (rejected on production firmware), which the public method name
    // wardSetRoot now maps to for test/dev seeding.
    requestType: 'WARDDebugSetRoot',
    responseType: 'WARDDebugSetRootAck',
    schema: PROTO.WARDDebugSetRoot,
    info: 'Inject an address-database Merkle root (debug-only)',
    confirmation: {
        view: 'device-management' as const,
        label: 'Inject the address-database Merkle root on the device (debug)?',
    },
    buildParams: (payload: PROTO.WARDDebugSetRoot) => ({
        root: payload.root,
    }),
});
