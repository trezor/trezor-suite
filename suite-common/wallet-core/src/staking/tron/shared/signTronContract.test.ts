import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import TrezorConnect from '@trezor/connect';

import { signTronContract } from './signTronContract';

const analytics = mockAnalytics<AnalyticsSharedEvents>();
const account = mockWalletAccount({ symbol: asNetworkSymbol('trx') });
const device = mockSuiteDevice();

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(TrezorConnect, 'blockchainGetInfo').mockResolvedValue({
        success: true,
        payload: { blockHash: 'a'.repeat(64), blockHeight: 1 },
    } as never);
    jest.spyOn(TrezorConnect, 'tronComposeTransaction').mockResolvedValue({
        success: true,
        payload: { ref_block_bytes: '0001', ref_block_hash: 'abcd', expiration: 1, timestamp: 0 },
    } as never);
});

it.each([
    'FreezeBalanceV2Contract',
    'UnfreezeBalanceV2Contract',
    'WithdrawBalanceContract',
    'WithdrawExpireUnfreezeContract',
    'VoteWitnessContract',
] as const)(
    'reports one cancellation for %s without broadcasting or sending private data',
    async type => {
        jest.spyOn(TrezorConnect, 'tronSignTransaction').mockResolvedValue({
            success: false,
            error: {
                code: 'Failure_ActionCancelled',
                message: 'private error with address and amount',
            },
        });
        const result = await signTronContract({
            account,
            device,
            analytics,
            contract: { type, parameter: { value: {} } } as never,
        });
        expect(result).toEqual({ error: { kind: 'cancelled' } });
        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'transaction/cancel',
            payload: { txType: 'stake', networkSymbol: 'trx', stage: 'signing' },
        });
    },
);

it.each([
    { code: 'Failure_PinCancelled', message: 'cancelled', expected: true },
    { code: 'Method_Cancel', message: 'tx-cancelled', expected: true },
    { code: 'Method_Cancel', message: 'tx-timeout', expected: false },
    { code: 'Device_Disconnected', message: 'disconnected', expected: false },
])('classifies $code/$message', async ({ code, message, expected }) => {
    jest.spyOn(TrezorConnect, 'tronSignTransaction').mockResolvedValue({
        success: false,
        error: { code, message },
    } as never);
    await signTronContract({
        account,
        device,
        analytics,
        contract: { type: 'VoteWitnessContract', parameter: { value: {} } } as never,
    });
    expect(analytics.report).toHaveBeenCalledTimes(expected ? 1 : 0);
});
