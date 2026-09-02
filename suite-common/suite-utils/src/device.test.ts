import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import fixtures from './__fixtures__/device';
import {
    findInstanceIndex,
    getChangelogUrl,
    getCheckBackupUrl,
    getDeviceInstances,
    getDeviceInstancesGroupedByDeviceId,
    getDeviceModelWithFlagshipFallback,
    getFirmwareDowngradeUrl,
    getFirstDeviceInstance,
    getIsDeviceConnectedViaBluetooth,
    getIsDeviceDescriptorApiTypeBluetooth,
    getIsDeviceRemembered,
    getNewInstanceNumber,
    getNewWalletNumber,
    getPackagingUrl,
    getPhysicalDeviceCount,
    getPhysicalDeviceUniqueIds,
    getSelectedDevice,
    getSortedDevicesWithoutInstances,
    getStatus,
    isDeviceWithButtonOnlyNoTouchscreen,
    isSelectedDevice,
    isSelectedInstance,
    sortByTimestamp,
} from './device';

describe(getStatus.name, () => {
    fixtures.getStatus.forEach(f => {
        it(f.status, () => {
            const status = getStatus(f.device);
            expect(status).toEqual(f.status);
        });
    });
});

describe(getIsDeviceDescriptorApiTypeBluetooth.name, () => {
    fixtures.getIsDeviceDescriptorApiTypeBluetooth.forEach(f => {
        it(f.description, () => {
            expect(getIsDeviceDescriptorApiTypeBluetooth(f.device)).toEqual(f.result);
        });
    });
});

describe(getIsDeviceConnectedViaBluetooth.name, () => {
    fixtures.getIsDeviceConnectedViaBluetooth.forEach(f => {
        it(f.description, () => {
            expect(getIsDeviceConnectedViaBluetooth(f.device)).toEqual(f.result);
        });
    });
});

describe(isSelectedDevice.name, () => {
    fixtures.isSelectedDevice.forEach(f => {
        it(f.description, () => {
            const instance = isSelectedDevice(f.selected, f.device);
            expect(instance).toEqual(f.result);
        });
    });
});

describe(isSelectedInstance.name, () => {
    fixtures.isSelectedInstance.forEach(f => {
        it(f.description, () => {
            const instance = isSelectedInstance(f.selected, f.device);
            expect(instance).toEqual(f.result);
        });
    });
});

describe(getNewInstanceNumber.name, () => {
    fixtures.getNewInstanceNumber.forEach(f => {
        it(f.description, () => {
            const instance = getNewInstanceNumber(f.state, f.device as AcquiredDevice);
            expect(instance).toEqual(f.result);
        });
    });
});

describe(getNewWalletNumber.name, () => {
    fixtures.getNewWalletNumber.forEach(f => {
        it(f.description, () => {
            const instance = getNewWalletNumber(f.state, f.device as AcquiredDevice);
            expect(instance).toEqual(f.result);
        });
    });
});

describe(findInstanceIndex.name, () => {
    fixtures.findInstanceIndex.forEach(f => {
        it(f.description, () => {
            const instance = findInstanceIndex(f.state, f.device as AcquiredDevice);
            expect(instance).toEqual(f.result);
        });
    });
});

describe(getSelectedDevice.name, () => {
    fixtures.getSelectedDevice.forEach(f => {
        it(f.description, () => {
            const instance = getSelectedDevice(f.device, f.state);
            expect(instance).toEqual(f.result);
        });
    });
});

describe(sortByTimestamp.name, () => {
    it(sortByTimestamp.name, () => {
        const result = sortByTimestamp(fixtures.sortByTimestamp.devices as any);
        expect(result).toEqual(fixtures.sortByTimestamp.result);
    });
});

describe(getFirstDeviceInstance.name, () => {
    fixtures.getFirstDeviceInstance.forEach(f => {
        it(f.description, () => {
            const sort = getFirstDeviceInstance(f.devices as any);
            expect(sort).toEqual(f.result);
        });
    });
});

describe(getDeviceInstances.name, () => {
    fixtures.getDeviceInstances.forEach(f => {
        it(f.description, () => {
            const sort = getDeviceInstances(f.selected as any, f.devices as any, f.excluded);
            expect(sort).toEqual(f.result);
        });
    });
});

describe(getDeviceInstancesGroupedByDeviceId.name, () => {
    fixtures.getDeviceInstancesGroupedByDeviceId.forEach(f => {
        it(f.description, () => {
            expect(getDeviceInstancesGroupedByDeviceId(f.devices as any)).toEqual(f.result);
        });
    });
});

describe(getSortedDevicesWithoutInstances.name, () => {
    fixtures.getSortedDevicesWithoutInstances.forEach(f => {
        it(f.description, () => {
            expect(getSortedDevicesWithoutInstances(f.devices as any, f.excludedDeviceId)).toEqual(
                f.result,
            );
        });
    });
});

describe(getIsDeviceRemembered.name, () => {
    fixtures.isDeviceRemembered.forEach(f => {
        it(f.description, () => {
            expect(getIsDeviceRemembered(f.device)).toEqual(f.result);
        });
    });
});

describe(getChangelogUrl.name, () => {
    fixtures.getChangelogUrl.forEach(f => {
        it(f.description, () => {
            expect(getChangelogUrl(f.device, f.revision)).toEqual(f.result);
        });
    });
});

describe(getCheckBackupUrl.name, () => {
    fixtures.getCheckBackupUrl.forEach(f => {
        it(f.description, () => {
            expect(getCheckBackupUrl(f.device)).toEqual(f.result);
        });
    });
});

describe(getPackagingUrl.name, () => {
    fixtures.getPackagingUrl.forEach(f => {
        it(f.description, () => {
            expect(getPackagingUrl(f.device)).toEqual(f.result);
        });
    });
});

describe(getFirmwareDowngradeUrl.name, () => {
    fixtures.getFirmwareDowngradeUrl.forEach(f => {
        it(f.description, () => {
            expect(getFirmwareDowngradeUrl(f.device)).toEqual(f.result);
        });
    });
});

describe('device utils', () => {
    test(isDeviceWithButtonOnlyNoTouchscreen.name, () => {
        expect(isDeviceWithButtonOnlyNoTouchscreen(DeviceModelInternal.T3B1)).toBe(true);
        expect(isDeviceWithButtonOnlyNoTouchscreen(DeviceModelInternal.T3T1)).toBe(false);
    });
});

describe(getPhysicalDeviceUniqueIds.name, () => {
    it('returns empty array for no devices', () => {
        expect(getPhysicalDeviceUniqueIds([])).toEqual([]);
    });

    it('returns single id for one device', () => {
        const devices = [mockSuiteDevice(undefined, { device_id: 'a' })];
        expect(getPhysicalDeviceUniqueIds(devices)).toEqual(['a']);
    });

    it('deduplicates ids across multiple instances of the same physical device', () => {
        const devices = [
            mockSuiteDevice({ instance: 1 }, { device_id: 'a' }),
            mockSuiteDevice({ instance: 2 }, { device_id: 'a' }),
            mockSuiteDevice(undefined, { device_id: 'b' }),
        ];
        expect(getPhysicalDeviceUniqueIds(devices)).toEqual(['a', 'b']);
    });

    // Regression guard: switching the filter to a pure null/undefined typeguard
    // would let empty-string ids through and inflate the count (used in analytics).
    it('filters out devices with an empty-string id', () => {
        const devices = [
            mockSuiteDevice(undefined, { device_id: '' }),
            mockSuiteDevice(undefined, { device_id: 'a' }),
        ];
        expect(getPhysicalDeviceUniqueIds(devices)).toEqual(['a']);
    });

    it('filters out devices with a null id', () => {
        const devices = [
            mockSuiteDevice(undefined, { device_id: null }),
            mockSuiteDevice(undefined, { device_id: 'a' }),
        ];
        expect(getPhysicalDeviceUniqueIds(devices)).toEqual(['a']);
    });
});

describe(getPhysicalDeviceCount.name, () => {
    it('counts unique physical devices, ignoring instances and falsy ids', () => {
        const devices = [
            mockSuiteDevice({ instance: 1 }, { device_id: 'a' }),
            mockSuiteDevice({ instance: 2 }, { device_id: 'a' }),
            mockSuiteDevice(undefined, { device_id: 'b' }),
            mockSuiteDevice(undefined, { device_id: '' }),
            mockSuiteDevice(undefined, { device_id: null }),
        ];
        expect(getPhysicalDeviceCount(devices)).toBe(2);
    });
});

describe(getDeviceModelWithFlagshipFallback.name, () => {
    it('returns the model reported by the device', () => {
        const device = mockSuiteDevice({}, { internal_model: DeviceModelInternal.T3T1 });

        expect(getDeviceModelWithFlagshipFallback(device)).toBe(DeviceModelInternal.T3T1);
    });

    it('returns the flagship model when the internal_model cannot be read', () => {
        const device = mockSuiteDevice({}, { internal_model: DeviceModelInternal.UNKNOWN });

        expect(getDeviceModelWithFlagshipFallback(device)).toBe(DEFAULT_FLAGSHIP_MODEL);
    });

    it('returns the flagship model when there is no device', () => {
        expect(getDeviceModelWithFlagshipFallback(undefined)).toBe(DEFAULT_FLAGSHIP_MODEL);
    });
});
