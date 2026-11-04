import type { evoluGetDelegatedIdentityKey } from './evoluGetDelegatedIdentityKey';
import type { evoluGetNode } from './evoluGetNode';
import type { evoluSignRegistrationRequest } from './evoluSignRegistrationRequest';

// Evolu identity protocol operations
export type TrezorConnectEvolu = {
    evoluGetNode: typeof evoluGetNode;
    evoluSignRegistrationRequest: typeof evoluSignRegistrationRequest;
    evoluGetDelegatedIdentityKey: typeof evoluGetDelegatedIdentityKey;
};
