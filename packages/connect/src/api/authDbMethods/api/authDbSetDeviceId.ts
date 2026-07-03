import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { createRawAuthDbMethod } from '../rawAuthDbMethod';

export default createRawAuthDbMethod({
    name: 'authDbSetDeviceId',
    schema: PROTO.AuthDbSetDeviceId,
    info: 'Set authdb device identifier',
    buildParams: (payload: PROTO.AuthDbSetDeviceId) => ({
        device_id: payload.device_id,
    }),
});
