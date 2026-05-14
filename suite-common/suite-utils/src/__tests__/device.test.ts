import { type AcquiredDevice } from '@suite-common/suite-types';
import { DeviceModelInternal } from '@trezor/device-utils';

import fixtures from '../__fixtures__/device';
import {
    findInstanceIndex,
    getChangelogUrl,
    getCheckBackupUrl,
    getDeviceInstances,
    getFirmwareDowngradeUrl,
    getFirstDeviceInstance,
    getIsDeviceConnectedViaBluetooth,
    getIsDeviceDescriptorApiTypeBluetooth,
    getIsDeviceRemembered,
    getNewInstanceNumber,
    getNewWalletNumber,
    getPackagingUrl,
    getSelectedDevice,
    getStatus,
    isDeviceWithButtonOnlyNoTouchscreen,
    isSelectedDevice,
    isSelectedInstance,
    sortByTimestamp,
} from '../device';

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
