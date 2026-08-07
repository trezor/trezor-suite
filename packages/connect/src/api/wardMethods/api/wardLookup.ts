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
        proof: payload.proof ?? [],
        ...(payload.app_id !== undefined && { app_id: payload.app_id }),
        ...(payload.key_type !== undefined && { key_type: payload.key_type }),
        ...(payload.device_id !== undefined && { device_id: payload.device_id }),
        // membership: self-describing leaf content (EncryptedLeaf | PlaintextLeaf)
        ...(payload.content !== undefined && { content: payload.content }),
        // non-membership: witness as two hashes
        ...(payload.witness_entry_key !== undefined && {
            witness_entry_key: payload.witness_entry_key,
        }),
        ...(payload.witness_commit !== undefined && {
            witness_commit: payload.witness_commit,
        }),
    }),
});
