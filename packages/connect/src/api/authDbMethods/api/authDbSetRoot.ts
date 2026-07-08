import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { createRawAuthDbMethod } from '../rawAuthDbMethod';

export default createRawAuthDbMethod({
    name: 'authDbSetRoot',
    schema: PROTO.AuthDbSetRoot,
    info: 'Set address-database Merkle root',
    confirmation: {
        view: 'device-management' as const,
        label: 'Update the address-database Merkle root stored on the device?',
    },
    buildParams: (payload: PROTO.AuthDbSetRoot) => ({
        root: payload.root,
        // Required by the wire protocol; all-zero is accepted only on debug builds
        // (plain unauthenticated root injection).
        mac: payload.mac,
        ...(payload.device_id !== undefined && { device_id: payload.device_id }),
        ...(payload.counter !== undefined && { counter: payload.counter }),
    }),
});
