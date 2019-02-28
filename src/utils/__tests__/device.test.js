import * as utils from 'utils/device';
import colors from 'config/colors';

describe('device utils', () => {
    it('get status', () => {
        expect(utils.getStatus({ connected: false }))
            .toBe('disconnected');

        expect(utils.getStatus({ connected: true, available: false }))
            .toBe('unavailable');

        expect(utils.getStatus({
            connected: true,
            available: false,
            type: null,
        })).toBe('unavailable');

        expect(utils.getStatus({
            connected: true,
            available: true,
            type: 'acquired',
        })).toBe('connected');

        expect(utils.getStatus({
            connected: true,
            available: true,
            type: 'unacquired',
        })).toBe('unacquired');

        expect(utils.getStatus({
            connected: true,
            available: true,
            type: 'acquired',
            status: 'occupied',
        })).toBe('used-in-other-window');
    });

    it('isWebUSB', () => {
        expect(utils.isWebUSB({ type: 'webusb', version: '1.6.0' })).toBe(true);
        expect(utils.isWebUSB({ type: 'aaaa', version: 'aaaaaa' })).toBe(false);
        expect(utils.isWebUSB({ type: 'webusb' })).toBe(true);
    });

    it('isDisabled', () => {
        expect(utils.isDisabled(
            { selectedDevice: { features: null } },
            [1, 2, 3],
            {
                version: 'webusb',
            },
        )).toBe(false);

        expect(utils.isDisabled(
            { features: null }, [], { version: 'test' },
        )).toBe(true);
    });

    it('get version', () => {
        expect(utils.getVersion({})).toBe('One');
        expect(utils.getVersion({ features: {} })).toBe('One');
        expect(utils.getVersion({ features: { major_version: null } })).toBe('One');
        expect(utils.getVersion({ features: { major_version: 0 } })).toBe('One');
        expect(utils.getVersion({ features: { major_version: 1 } })).toBe('One');
        expect(utils.getVersion({ features: { major_version: 2 } })).toBe('T');
    });

    it('get status color', () => {
        expect(utils.getStatusColor(0)).toBe(colors.TEXT_PRIMARY);
        expect(utils.getStatusColor(null)).toBe(colors.TEXT_PRIMARY);
        expect(utils.getStatusColor('sdsdsdsd')).toBe(colors.TEXT_PRIMARY);
        expect(utils.getStatusColor('used-in-other-window')).toBe(colors.WARNING_PRIMARY);
        expect(utils.getStatusColor('connected')).toBe(colors.GREEN_PRIMARY);
        expect(utils.getStatusColor('unacquired')).toBe(colors.WARNING_PRIMARY);
        expect(utils.getStatusColor('disconnected')).toBe(colors.ERROR_PRIMARY);
        expect(utils.getStatusColor('unavailable')).toBe(colors.ERROR_PRIMARY);
    });

    it('get status name', () => {
        expect(utils.getStatusName(0)).toBe('Status unknown');
        expect(utils.getStatusName(null)).toBe('Status unknown');
        expect(utils.getStatusName('sdsdsdsd')).toBe('Status unknown');
        expect(utils.getStatusName('used-in-other-window')).toBe('Used in other window');
        expect(utils.getStatusName('connected')).toBe('Connected');
        expect(utils.getStatusName('unacquired')).toBe('Used in other window');
        expect(utils.getStatusName('disconnected')).toBe('Disconnected');
        expect(utils.getStatusName('unavailable')).toBe('Unavailable');
    });
});