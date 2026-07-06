import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { createRawAuthDbMethod } from '../rawAuthDbMethod';

export default createRawAuthDbMethod({
    name: 'authDbQueueOfflineOperation',
    schema: PROTO.AuthDbQueueOfflineOperation,
    info: 'Queue a signed offline operation on the device',
    confirmation: {
        view: 'device-management' as const,
        label: 'Queue this address-database change for later sync?',
    },
    buildParams: (payload: PROTO.AuthDbQueueOfflineOperation) => ({
        address: payload.address,
        old_value: payload.old_value,
        new_value: payload.new_value,
    }),
});
