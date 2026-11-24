import { deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import TrezorConnect from '@trezor/connect';

import { signTronContract } from './signTronContract';

const account = mockWalletAccount({ symbol: asNetworkSymbol('trx') });
const device = mockSuiteDevice({
    path: 'verified',
    connected: true,
    available: true,
    state: { staticSessionId: account.deviceState, sessionId: 'verified-session' },
});

const buildState = (selectedDevice?: TrezorDevice) => ({
    device: { ...deviceInitialState, selectedDevice },
});

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(TrezorBlockchain, 'getInfo').mockResolvedValue({
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
] as const)('classifies device rejection for %s as cancelled', async type => {
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
        getState: () => buildState(device),
        contract: { type, parameter: { value: {} } } as never,
    });
    expect(result).toEqual({ error: { kind: 'cancelled' } });
});

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
    const result = await signTronContract({
        account,
        device,
        getState: () => buildState(device),
        contract: { type: 'VoteWitnessContract', parameter: { value: {} } } as never,
    });
    expect(result).toEqual({
        error: expected ? { kind: 'cancelled' } : { kind: 'sign-failed', message },
    });
});

it.each([
    ['TrezorBlockchain.getInfo', () => jest.spyOn(TrezorBlockchain, 'getInfo')],
    ['tronComposeTransaction', () => jest.spyOn(TrezorConnect, 'tronComposeTransaction')],
    ['tronSignTransaction', () => jest.spyOn(TrezorConnect, 'tronSignTransaction')],
] as const)(
    'returns a safe error if %s rejects while preparing the transaction',
    async (_, spyOnMethod) => {
        spyOnMethod().mockRejectedValueOnce(new Error('Backend account data'));

        await expect(
            signTronContract({
                account,
                device,
                getState: () => buildState(device),
                contract: { type: 'UnfreezeBalanceV2Contract', parameter: { value: {} } } as never,
            }),
        ).resolves.toEqual({ error: { kind: 'sign-failed' } });
    },
);

it.each([
    ['disconnected', undefined],
    ['unavailable', mockSuiteDevice({ ...device, available: false })],
    ['another transport', mockSuiteDevice({ ...device, path: 'other' })],
    [
        'another wallet',
        mockSuiteDevice({ ...device, state: { staticSessionId: 'other@device:0' } }),
    ],
] as const)(
    'stops before signing if the verified device is %s after composing',
    async (_, selectedDevice) => {
        const sign = jest.spyOn(TrezorConnect, 'tronSignTransaction');
        let currentDevice: TrezorDevice | undefined = device;
        const result = signTronContract({
            account,
            device,
            getState: () => buildState(currentDevice),
            contract: { type: 'VoteWitnessContract', parameter: { value: {} } } as never,
        });

        currentDevice = selectedDevice;

        await expect(result).resolves.toEqual({
            error: { kind: 'sign-failed', message: 'Device not found' },
        });
        expect(sign).not.toHaveBeenCalled();
    },
);

it('uses the current session of the verified wallet at the signing boundary', async () => {
    const refreshed = mockSuiteDevice({
        ...device,
        state: { staticSessionId: account.deviceState, sessionId: 'refreshed' },
    });
    const sign = jest.spyOn(TrezorConnect, 'tronSignTransaction').mockResolvedValue({
        success: false,
        error: { code: 'Failure_ActionCancelled', message: 'cancelled' },
    });

    await signTronContract({
        account,
        device,
        getState: () => buildState(refreshed),
        contract: { type: 'VoteWitnessContract', parameter: { value: {} } } as never,
    });

    expect(sign).toHaveBeenCalledWith(
        expect.objectContaining({
            device: expect.objectContaining({ state: refreshed.state }),
        }),
    );
});
