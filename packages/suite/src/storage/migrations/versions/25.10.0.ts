import { createMigration } from '@suite/idb-migration-utils';
import { type PersistentDeviceData } from '@suite-common/suite-types';
import { DeviceModelInternal } from '@trezor/device-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

type DeletedSecurityType =
    | {
          devicesWithFailedEntropyCheck?: (string | null)[];
      }
    | undefined;

export default createMigration<SuiteDBSchema>('25.10.0', async (db, tx) => {
    if (!db.objectStoreNames.contains('persistentDeviceData')) {
        db.createObjectStore('persistentDeviceData');
    }

    // @ts-expect-error security no longer exists
    if (db.objectStoreNames.contains('security')) {
        // @ts-expect-error security no longer exists
        const securityStore = tx.objectStore('security');
        const security = (await securityStore.get('security')) as DeletedSecurityType;

        if (Array.isArray(security?.devicesWithFailedEntropyCheck)) {
            const newData: PersistentDeviceData[] = security.devicesWithFailedEntropyCheck.map(
                deviceId => ({
                    // minimal available information to match entropy check failure
                    device_id: deviceId,
                    lastEntropyCheckResult: { success: false },
                    // placeholder values, will be overwritten during the next device connect
                    internal_model: DeviceModelInternal.UNKNOWN,
                    fw_vendor: null,
                    revision: null,
                    label: null,
                    initialized: null,
                    firmwareVersion: null,
                    lastConnectedVia: null,
                    delegatedIdentityKey: null,
                }),
            );

            tx.objectStore('persistentDeviceData').put(newData, 'persistentDeviceData');
        }

        // @ts-expect-error security no longer exists
        db.deleteObjectStore('security');
    }
});
