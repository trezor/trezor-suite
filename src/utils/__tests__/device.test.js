import * as dUtils from 'utils/device';

describe('device utils', () => {
    it('get status', () => {
        const deviceMock = [
            {
                connected: false,
            },
            {
                connected: true,
                available: false,
            },
            {
                connected: true,
                available: false,
                type: null,
            },
            {
                connected: true,
                available: true,
                type: 'acquired',
            },
            {
                connected: true,
                available: true,
                type: 'unacquired',
            },
            {
                connected: true,
                available: true,
                type: 'acquired',
                status: 'occupied',
            },
        ];

        deviceMock.forEach((device) => {
            expect(dUtils.getStatus(device)).toMatchSnapshot();
        });
    });

    it('isWebUSB', () => {
        const data = [
            { transport: { version: ['webusb'] } },
            { transport: { version: ['aaaaaa'] } },
            { transport: { version: ['webusb', 'test'] } },
        ];

        data.forEach((item) => {
            expect(dUtils.isWebUSB(item.transport)).toMatchSnapshot();
        });
    });

    it('isDisabled', () => {
        const data = [
            { selectedDevice: { features: null }, devices: [1, 2, 3], transport: { version: ['webusb', 'test'] } },
            { selectedDevice: { features: null }, devices: [], transport: { version: ['test'] } },
        ];

        data.forEach((item) => {
            expect(dUtils.isDisabled(item.selectedDevice, item.devices, item.transport)).toMatchSnapshot();
        });
    });

    it('get version', () => {
        const deviceMock = [
            { },
            { features: {} },
            { features: { major_version: null } },
            { features: { major_version: 0 } },
            { features: { major_version: 1 } },
            { features: { major_version: 2 } },
        ];

        deviceMock.forEach((device) => {
            expect(dUtils.getVersion(device)).toMatchSnapshot();
        });
    });

    it('get status color', () => {
        const entry = [
            0,
            null,
            'sdsdsdsd',
            'used-in-other-window',
            'connected',
            'unacquired',
            'disconnected',
            'unavailable',
        ];

        entry.forEach((status) => {
            expect(dUtils.getStatusColor(status)).toMatchSnapshot();
        });
    });

    it('get status name', () => {
        const entry = [
            0,
            null,
            'sdsdsdsd',
            'used-in-other-window',
            'connected',
            'unacquired',
            'disconnected',
            'unavailable',
        ];

        entry.forEach((status) => {
            expect(dUtils.getStatusName(status)).toMatchSnapshot();
        });
    });
});
