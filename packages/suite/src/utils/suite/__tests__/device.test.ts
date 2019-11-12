import * as utils from '@suite-utils/device';
import { AcquiredDevice } from '@suite-types';
import fixtures from './fixtures/device';

describe('getStatus + getStatusName + getStatusColor', () => {
    fixtures.getStatus.forEach(f => {
        it(f.status, () => {
            const status = utils.getStatus(f.device);
            expect(status).toEqual(f.status);
            // @ts-ignore: InjectedIntl mock
            const name = utils.getStatusName(status, {
                formatMessage: (s: any) => s.defaultMessage,
            });
            expect(name).toEqual(f.name);
            expect(utils.getStatusColor(status)).toEqual(f.color);
        });
    });
});

describe('isWebUSB', () => {
    fixtures.isWebUSB.forEach(f => {
        it(f.description, () => {
            const instance = utils.isWebUSB(f.transport);
            expect(instance).toEqual(f.result);
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

describe('getVersion', () => {
    fixtures.getVersion.forEach(f => {
        it(f.description, () => {
            const instance = utils.getVersion(f.device);
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

describe('getOtherDevices', () => {
    fixtures.getOtherDevices.forEach(f => {
        it(f.description, () => {
            const sort = utils.getOtherDevices(f.selected as any, f.devices as any);
            expect(sort).toEqual(f.result);
        });
    });
});

describe('getDeviceInstances', () => {
    fixtures.getDeviceInstances.forEach(f => {
        it(f.description, () => {
            const sort = utils.getDeviceInstances(f.selected as any, f.devices as any);
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
