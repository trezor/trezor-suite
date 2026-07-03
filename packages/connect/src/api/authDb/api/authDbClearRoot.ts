import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { createRawAuthDbMethod } from '../rawAuthDbMethod';

export default createRawAuthDbMethod({
    name: 'authDbClearRoot',
    schema: PROTO.AuthDbClearRoot,
    buildParams: () => ({}),
});
