import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { createRawAuthDbMethod } from '../rawAuthDbMethod';

export default createRawAuthDbMethod({
    name: 'authDbApprove',
    schema: PROTO.AuthDbApprove,
    info: 'Approve address-database record',
    buildParams: (payload: PROTO.AuthDbApprove) => ({
        address: payload.address,
        value: payload.value,
    }),
});
