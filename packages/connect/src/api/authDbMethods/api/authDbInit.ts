import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { createRawAuthDbMethod } from '../rawAuthDbMethod';

export default createRawAuthDbMethod({
    name: 'authDbInit',
    schema: PROTO.AuthDbInit,
    info: 'Initialize the device AuthDB state from the Quota Manager + stored root',
    confirmation: {
        view: 'device-management' as const,
        label: 'Initialize the address database on the device?',
    },
    buildParams: (payload: PROTO.AuthDbInit) => ({
        qm_counter: payload.qm_counter,
        qm_signature: payload.qm_signature,
        ...(payload.root !== undefined && { root: payload.root }),
        ...(payload.counter !== undefined && { counter: payload.counter }),
        ...(payload.root_mac !== undefined && { root_mac: payload.root_mac }),
    }),
});
