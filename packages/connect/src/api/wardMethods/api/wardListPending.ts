import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { createRawWardMethod } from '../rawWardMethod';

export default createRawWardMethod({
    name: 'wardListPending',
    // WARDListPendingEdits is input-free and always echoes wallet_id, independent of
    // tree state — which makes it the reliable wallet_id probe (unlike WARDLookup, which
    // rejects a proofless non-membership query once the tree is non-empty).
    requestType: 'WARDListPendingEdits',
    responseType: 'WARDListPendingEditsAck',
    schema: PROTO.WARDListPendingEdits,
    info: 'List the device pending-edit queue addresses',
    buildParams: (_payload: PROTO.WARDListPendingEdits) => ({}),
});
