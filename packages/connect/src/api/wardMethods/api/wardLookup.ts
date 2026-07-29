import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { createRawWardMethod } from '../rawWardMethod';

export default createRawWardMethod({
    name: 'wardLookup',
    // Wire message renamed WardLookup -> WARDLookup in firmware; the public method
    // name stays wardLookup (used by connect-cli's wallet_id probe, which relies on
    // this low-level call echoing wallet_id without rejecting a mismatch).
    requestType: 'WARDLookup',
    responseType: 'WARDLookupAck',
    schema: PROTO.WARDLookup,
    useEmptyPassphrase: false,
    buildParams: (payload: PROTO.WARDLookup) => ({
        address: payload.address,
        ...(payload.value !== undefined && { value: payload.value }),
        proof: payload.proof ?? [],
        ...(payload.witness_address !== undefined && { witness_address: payload.witness_address }),
        ...(payload.witness_value !== undefined && { witness_value: payload.witness_value }),
        ...(payload.counter !== undefined && { counter: payload.counter }),
        ...(payload.witness_counter !== undefined && { witness_counter: payload.witness_counter }),
    }),
});
