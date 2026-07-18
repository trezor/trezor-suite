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
export interface TrezorConnectDevice {
    getFeatures: typeof getFeatures;
    getDeviceState: typeof getDeviceState;
    firmwareUpdate: typeof firmwareUpdate;
    showDeviceTutorial: typeof showDeviceTutorial;
    requestLogin: typeof requestLogin;
    cipherKeyValue: typeof cipherKeyValue;
    unlockPath: typeof unlockPath;
    getOwnershipId: typeof getOwnershipId;
    getOwnershipProof: typeof getOwnershipProof;
}
