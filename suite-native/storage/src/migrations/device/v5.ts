import { type PersistentDeviceData } from '@suite-common/suite-types';

export const backfillManualCheckResult = (
    persistentDeviceData: PersistentDeviceData[],
): PersistentDeviceData[] =>
    persistentDeviceData.map(entry => ({
        ...entry,
        manualCheckResult: { success: true },
    }));
