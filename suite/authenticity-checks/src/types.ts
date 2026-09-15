import type { RouterRootState } from '@suite/router';
import type { SuiteSettingsRootState } from '@suite/settings';
import type { DeviceRootState } from '@suite-common/device';
import type { MessageSystemRootState } from '@suite-common/message-system';
import type { PersistentDeviceDataRootState } from '@suite-common/persistent-device-data';

export type AuthenticityChecksRootState = SuiteSettingsRootState &
    DeviceRootState &
    PersistentDeviceDataRootState &
    MessageSystemRootState &
    RouterRootState;
