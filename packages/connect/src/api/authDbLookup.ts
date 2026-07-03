import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { createRawAuthDbMethod } from './authDb/rawAuthDbMethod';

export default createRawAuthDbMethod({
    name: 'authDbLookup',
    schema: PROTO.AuthDbLookup,
    useEmptyPassphrase: false,
    buildParams: (payload: PROTO.AuthDbLookup) => ({
        address: payload.address,
        ...(payload.value !== undefined && { value: payload.value }),
        proof: payload.proof ?? [],
        ...(payload.witness_address !== undefined && { witness_address: payload.witness_address }),
        ...(payload.witness_value !== undefined && { witness_value: payload.witness_value }),
    }),
});
