import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type ThpRootState, selectThpCredentials } from '@suite-common/thp';
import { createWeakMapSelector } from '@trezor/redux-utils';

const createMemoizedSelector = createWeakMapSelector.withTypes<DeviceRootState & ThpRootState>();

// Deprecated: Temporary hack until THP credentials are migrated to THP reducer.
export const selectDeviceAutoConnectCredentials = createMemoizedSelector(
    [selectSelectedDevice, selectThpCredentials],
    (device, thpCredentials) =>
        device?.thp?.credentials.filter(
            c => c.autoconnect && thpCredentials.some(tc => tc.credential === c.credential),
        ) ?? [],
);
