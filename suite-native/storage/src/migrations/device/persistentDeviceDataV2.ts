import { type PersistentDeviceData } from '@suite-common/suite-types';

type Descriptor = PersistentDeviceData['descriptors'][number];

type LegacyPersistentDeviceData = Omit<PersistentDeviceData, 'descriptors'> & {
    descriptor?: Descriptor;
    descriptors?: Descriptor[];
};

export const replaceDescriptorWithDescriptors = (
    persistentDeviceData: LegacyPersistentDeviceData[],
): PersistentDeviceData[] =>
    persistentDeviceData.map(({ descriptor, ...entry }) => ({
        ...entry,
        descriptors: entry.descriptors ?? (descriptor ? [descriptor] : []),
    }));
