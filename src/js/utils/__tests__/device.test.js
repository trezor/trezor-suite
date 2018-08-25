import * as dUtils from 'utils/device';

describe('device utils', () => {
    it('get status', () => {
        const deviceMock = [
            {
                device: {
                    connected: false,
                    type: 'acquired',
                    status: 'occupied',
                },
            },
            { device: { connected: true } },
            { device: { available: false } },
            { device: { available: true } },
        ];

        deviceMock.forEach((device) => {
            expect(dUtils.getStatusName(device)).toMatchSnapshot();
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
