import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { cipherKeyValue } from './cipherKeyValue';
import type { firmwareUpdate } from './firmwareUpdate';
import type { getDeviceState } from './getDeviceState';
import type { getFeatures } from './getFeatures';
import type { getOwnershipId } from './getOwnershipId';
import type { getOwnershipProof } from './getOwnershipProof';
import type { requestLogin } from './requestLogin';
import type { showDeviceTutorial } from './showDeviceTutorial';
import type { unlockPath } from './unlockPath';

// Device configuration, firmware, security, and hardware control
export const TrezorConnectDevice = Type.Object({
    getFeatures: Type.Unsafe<typeof getFeatures>(),
    getDeviceState: Type.Unsafe<typeof getDeviceState>(),
    firmwareUpdate: Type.Unsafe<typeof firmwareUpdate>(),
    showDeviceTutorial: Type.Unsafe<typeof showDeviceTutorial>(),
    requestLogin: Type.Unsafe<typeof requestLogin>(),
    cipherKeyValue: Type.Unsafe<typeof cipherKeyValue>(),
    unlockPath: Type.Unsafe<typeof unlockPath>(),
    getOwnershipId: Type.Unsafe<typeof getOwnershipId>(),
    getOwnershipProof: Type.Unsafe<typeof getOwnershipProof>(),
});
export type TrezorConnectDevice = Static<typeof TrezorConnectDevice>;
