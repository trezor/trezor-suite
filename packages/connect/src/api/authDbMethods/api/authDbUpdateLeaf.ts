import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { createRawAuthDbMethod } from '../rawAuthDbMethod';

export default createRawAuthDbMethod({
    name: 'authDbUpdateLeaf',
    schema: PROTO.AuthDbUpdateLeaf,
    info: 'Update address-database leaf',
    buildParams: (payload: PROTO.AuthDbUpdateLeaf) => ({
        address: payload.address,
        old_value: payload.old_value,
        new_value: payload.new_value,
        proof: payload.proof ?? [],
        ...(payload.witness_address !== undefined && { witness_address: payload.witness_address }),
        ...(payload.witness_value !== undefined && { witness_value: payload.witness_value }),
        ...(payload.mac !== undefined && { mac: payload.mac }),
        ...(payload.device_id !== undefined && { device_id: payload.device_id }),
        ...(payload.old_counter !== undefined && { old_counter: payload.old_counter }),
        new_counter: payload.new_counter,
        ...(payload.witness_counter !== undefined && { witness_counter: payload.witness_counter }),
    }),
});
