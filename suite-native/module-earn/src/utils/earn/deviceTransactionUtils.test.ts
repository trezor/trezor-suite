import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import TrezorConnect from '@trezor/connect';

import { signYieldTransactionOnDevice } from './deviceTransactionUtils';

const analytics = mockNativeAnalytics();

beforeEach(() => jest.clearAllMocks());

it.each([
    { code: 'Failure_ActionCancelled', message: 'cancelled', expected: true },
    { code: 'Failure_PinCancelled', message: 'cancelled', expected: true },
    { code: 'Method_Cancel', message: 'tx-cancelled', expected: true },
    { code: 'Method_Cancel', message: 'tx-timeout', expected: false },
    { code: 'Device_Disconnected', message: 'disconnected', expected: false },
])('reports only intentional cancellation: $code/$message', async ({ code, message, expected }) => {
    jest.spyOn(TrezorConnect, 'ethereumSignTransaction').mockResolvedValue({
        success: false,
        error: { code, message },
    } as never);
    await signYieldTransactionOnDevice({
        analytics,
        networkSymbol: 'eth',
        device: mockSuiteDevice(),
        path: "m/44'/60'/0'/0/0",
        transaction: {
            to: '0x' + '1'.repeat(40),
            value: '0x0',
            chainId: 1,
            nonce: '0x0',
            gasLimit: '0x5208',
            gasPrice: '0x1',
        },
        addressDisplayType: AddressDisplayOptions.ORIGINAL,
    });
    expect(analytics.report).toHaveBeenCalledTimes(expected ? 1 : 0);
    if (expected)
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'transaction/cancel',
            payload: { txType: 'yield', networkSymbol: 'eth', stage: 'signing' },
        });
});
