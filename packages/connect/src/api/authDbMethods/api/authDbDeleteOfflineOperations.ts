import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { createRawAuthDbMethod } from '../rawAuthDbMethod';

export default createRawAuthDbMethod({
    name: 'authDbDeleteOfflineOperations',
    schema: PROTO.AuthDbDeleteOfflineOperations,
    info: 'Garbage-collect applied offline operations from the device queue',
    buildParams: () => ({}),
});
