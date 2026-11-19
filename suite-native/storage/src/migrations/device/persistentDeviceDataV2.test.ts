import { defaultDevicePersistentData } from '@suite-common/suite-types/mocks';

import { replaceDescriptorWithDescriptors } from './persistentDeviceDataV2';

const { descriptors: _descriptors, ...legacyDevicePersistentData } = defaultDevicePersistentData;

const bluetoothDescriptor = { apiType: 'bluetooth', id: 'bt-id' } as const;

describe('replaceDescriptorWithDescriptors', () => {
    it('moves the Bluetooth descriptor to the descriptors array', () => {
        const migrated = replaceDescriptorWithDescriptors([
            { ...legacyDevicePersistentData, descriptor: bluetoothDescriptor },
        ]);

        expect(migrated).toEqual([
            { ...legacyDevicePersistentData, descriptors: [bluetoothDescriptor] },
        ]);
    });

    it('sets empty descriptors for entries without a descriptor', () => {
        const migrated = replaceDescriptorWithDescriptors([legacyDevicePersistentData]);

        expect(migrated).toEqual([{ ...legacyDevicePersistentData, descriptors: [] }]);
    });

    it('keeps descriptors that are already migrated', () => {
        const migrated = replaceDescriptorWithDescriptors([
            { ...legacyDevicePersistentData, descriptors: [bluetoothDescriptor] },
        ]);

        expect(migrated).toEqual([
            { ...legacyDevicePersistentData, descriptors: [bluetoothDescriptor] },
        ]);
    });
});
