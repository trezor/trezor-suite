import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { evoluGetDelegatedIdentityKey } from './evoluGetDelegatedIdentityKey';
import type { evoluGetNode } from './evoluGetNode';
import type { evoluSignRegistrationRequest } from './evoluSignRegistrationRequest';

// Evolu identity protocol operations
export const TrezorConnectEvolu = Type.Object({
    evoluGetNode: Type.Unsafe<typeof evoluGetNode>(),
    evoluSignRegistrationRequest: Type.Unsafe<typeof evoluSignRegistrationRequest>(),
    evoluGetDelegatedIdentityKey: Type.Unsafe<typeof evoluGetDelegatedIdentityKey>(),
});
export type TrezorConnectEvolu = Static<typeof TrezorConnectEvolu>;
