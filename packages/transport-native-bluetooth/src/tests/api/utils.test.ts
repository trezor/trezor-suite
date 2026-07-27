import { type Device } from 'react-native-ble-plx';

import { base64ToByteArray, toBluetoothDevice } from '../../api/utils';

describe(base64ToByteArray.name, () => {
    test.each([
        ['', []],
        ['Zm9v', [102, 111, 111]],
        ['NDI=', [52, 50]],
    ])('%s converted correctly', (value, expectedResult) => {
        expect(base64ToByteArray(value)).toEqual(expectedResult);
    });
});

describe(toBluetoothDevice.name, () => {
    const MOCKED_NOW = new Date('2025-09-30T17:15:21.000Z').getTime();

    beforeAll(() => jest.spyOn(Date, 'now').mockReturnValue(MOCKED_NOW));
    afterAll(() => jest.restoreAllMocks());

    test.each([
        [
            'incomplete',
            {
                id: 'b59b57fe-b677-487f-81b2-12f315b3f27e',
            },
            {
                id: 'b59b57fe-b677-487f-81b2-12f315b3f27e',
                name: 'Unknown',
                manufacturerData: [],
                lastUpdatedTimestamp: MOCKED_NOW,
                connectionStatus: { type: 'disconnected' },
            },
        ],
        [
            'complete',
            {
                id: 'b59b57fe-b677-487f-81b2-12f315b3f27e',
                name: 'Trezor Safe 7',
                manufacturerData: 'KQ8BAAYAAAA=',
            },
            {
                id: 'b59b57fe-b677-487f-81b2-12f315b3f27e',
                name: 'Trezor Safe 7',
                manufacturerData: [1, 0, 6, 0, 0, 0],
                lastUpdatedTimestamp: MOCKED_NOW,
                connectionStatus: { type: 'disconnected' },
            },
        ],
    ])('%s device mapped correctly', (_, device, expectedResult) => {
        expect(toBluetoothDevice(device as Device)).toEqual(expectedResult);
    });
});
