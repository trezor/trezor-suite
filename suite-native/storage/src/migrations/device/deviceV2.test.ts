import { migrateDeviceState } from './v2';

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
                state: 'testWallet@testDevice:0',
                otherKey: 'otherValue',
            },
        ];

        const migratedAccounts = migrateDeviceState(oldDevices);

        const newDevices = [
            {
                state: {
                    staticSessionId: 'testWallet@testDevice:0',
                },
                otherKey: 'otherValue',
            },
        ];
        expect(migratedAccounts).toEqual(newDevices);
    });

    it('should migrate old devices with string state and with _state to new format', () => {
        const oldDevices = [
            {
                state: 'testWallet@testDevice:0',
                _state: {
                    staticSessionId: 'testWallet@testDevice:0',
                    deriveCardano: true,
                },
                otherKey: 'otherValue',
            },
        ];

        const migratedAccounts = migrateDeviceState(oldDevices);

        const newDevices = [
            {
                state: {
                    staticSessionId: 'testWallet@testDevice:0',
                    deriveCardano: true,
                },
                otherKey: 'otherValue',
            },
        ];
        expect(migratedAccounts).toEqual(newDevices);
    });
});
