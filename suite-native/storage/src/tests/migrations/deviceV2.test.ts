import { migrateDeviceState } from '../../migrations/device/v2';

describe('migrateDeviceState', () => {
    it('should migrate old devices without state to new format', () => {
        const oldDevices = [
            {
                state: undefined,
                otherKey: 'otherValue',
            },
        ];

        const migratedAccounts = migrateDeviceState(oldDevices);

        expect(migratedAccounts).toEqual(oldDevices);
    });

    it('should migrate old devices with string state, without _state to new format', () => {
        const oldDevices = [
            {
                state: 'staticSessionId',
                otherKey: 'otherValue',
            },
        ];

        const migratedAccounts = migrateDeviceState(oldDevices);

        const newDevices = [
            {
                state: {
                    staticSessionId: 'staticSessionId',
                },
                otherKey: 'otherValue',
            },
        ];
        expect(migratedAccounts).toEqual(newDevices);
    });

    it('should migrate old devices with string state and with _state to new format', () => {
        const oldDevices = [
            {
                state: 'staticSessionId',
                _state: {
                    staticSessionId: 'staticSessionId',
                    deriveCardano: true,
                },
                otherKey: 'otherValue',
            },
        ];

        const migratedAccounts = migrateDeviceState(oldDevices);

        const newDevices = [
            {
                state: {
                    staticSessionId: 'staticSessionId',
                    deriveCardano: true,
                },
                otherKey: 'otherValue',
            },
        ];
        expect(migratedAccounts).toEqual(newDevices);
    });
});
