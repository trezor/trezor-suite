import * as utils from '@suite-utils/device';
import { getDeviceModel } from '@trezor/device-utils';
import { AcquiredDevice } from '@suite-types';
import fixtures from '../__fixtures__/device';

describe('getStatus', () => {
    fixtures.getStatus.forEach(f => {
        it(f.status, () => {
            const status = utils.getStatus(f.device);
            expect(status).toEqual(f.status);
        });
    });
});

describe('isDeviceAccessible', () => {
    fixtures.isDeviceAccessible.forEach(f => {
        it(f.description, () => {
            const instance = utils.isDeviceAccessible(f.device);
            expect(instance).toEqual(f.result);
        });
    });
});

describe('isSelectedDevice', () => {
    fixtures.isSelectedDevice.forEach(f => {
        it(f.description, () => {
            const instance = utils.isSelectedDevice(f.selected, f.device);
            expect(instance).toEqual(f.result);
        });
    });
});

describe('isSelectedInstance', () => {
    fixtures.isSelectedInstance.forEach(f => {
        it(f.description, () => {
            const instance = utils.isSelectedInstance(f.selected, f.device);
            expect(instance).toEqual(f.result);
        });
    });
});

// getDeviceModel is not part of suite package. However, tests are dependant on definitions from suite package.
describe('getDeviceModel', () => {
    fixtures.getDeviceModel.forEach(f => {
        it(f.description, () => {
            const instance = getDeviceModel(f.device);
            expect(instance).toEqual(f.result);
        });
    });
});

describe('getNewInstanceNumber', () => {
    fixtures.getNewInstanceNumber.forEach(f => {
        it(f.description, () => {
            const instance = utils.getNewInstanceNumber(f.state, f.device as AcquiredDevice);
            expect(instance).toEqual(f.result);
        });
    });
});

describe('getNewWalletNumber', () => {
    fixtures.getNewWalletNumber.forEach(f => {
        it(f.description, () => {
            const instance = utils.getNewWalletNumber(f.state, f.device as AcquiredDevice);
            expect(instance).toEqual(f.result);
        });
    });
});

describe('findInstanceIndex', () => {
    fixtures.findInstanceIndex.forEach(f => {
        it(f.description, () => {
            const instance = utils.findInstanceIndex(f.state, f.device as AcquiredDevice);
            expect(instance).toEqual(f.result);
        });
    });
});

describe('getSelectedDevice', () => {
    fixtures.getSelectedDevice.forEach(f => {
        it(f.description, () => {
            const instance = utils.getSelectedDevice(f.device, f.state);
            expect(instance).toEqual(f.result);
        });
    });
});

describe('sortByTimestamp', () => {
    it('sortByTimestamp', () => {
        const result = utils.sortByTimestamp(fixtures.sortByTimestamp.devices as any);
        expect(result).toEqual(fixtures.sortByTimestamp.result);
    });
});

describe('getFirstDeviceInstance', () => {
    fixtures.getFirstDeviceInstance.forEach(f => {
        it(f.description, () => {
            const sort = utils.getFirstDeviceInstance(f.devices as any);
            expect(sort).toEqual(f.result);
        });
    });
});

describe('getDeviceInstances', () => {
    fixtures.getDeviceInstances.forEach(f => {
        it(f.description, () => {
            const sort = utils.getDeviceInstances(f.selected as any, f.devices as any, f.excluded);
            expect(sort).toEqual(f.result);
        });
    });
});

describe('isDeviceRemembered', () => {
    fixtures.isDeviceRemembered.forEach(f => {
        it(f.description, () => {
            expect(utils.isDeviceRemembered(f.device)).toEqual(f.result);
        });
    });
});

describe('parseFirmwareChangelog', () => {
    fixtures.parseFirmwareChangelog.forEach(f => {
        it(f.description, () => {
            expect(utils.parseFirmwareChangelog(f.release)).toEqual(f.result);
        });
    });
});

describe('getChangelogUrl', () => {
    fixtures.getChangelogUrl.forEach(f => {
        it(f.description, () => {
            expect(utils.getChangelogUrl(f.device, f.revision)).toEqual(f.result);
        });
    });
});

describe('getCheckBackupUrl', () => {
    fixtures.getCheckBackupUrl.forEach(f => {
        it(f.description, () => {
            expect(utils.getCheckBackupUrl(f.device)).toEqual(f.result);
        });
    });
});

describe('getPackagingUrl', () => {
    fixtures.getPackagingUrl.forEach(f => {
        it(f.description, () => {
            expect(utils.getPackagingUrl(f.device)).toEqual(f.result);
        });
    });
});

describe('getFirmwareDowngradeUrl', () => {
    fixtures.getFirmwareDowngradeUrl.forEach(f => {
        it(f.description, () => {
            expect(utils.getFirmwareDowngradeUrl(f.device)).toEqual(f.result);
        });
    });
});
