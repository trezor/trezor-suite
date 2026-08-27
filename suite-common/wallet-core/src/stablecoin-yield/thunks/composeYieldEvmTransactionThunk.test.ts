import { combineReducers } from '@reduxjs/toolkit';

import { deviceInitialState } from '@suite-common/device';
import { configureMockStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { composeYieldEvmTransactionThunk } from './composeYieldEvmTransactionThunk';
import { accountsInitialState } from '../../accounts/accountsReducer';
import { blockchainInitialState } from '../../blockchain/blockchainReducer';
import { feesReducer } from '../../fees/feesReducer';
import { transactionsInitialState } from '../../transactions/transactionsReducer';
import { estimateYieldFeeLevel } from '../utils/stablecoinYieldFeeEstimation';

jest.mock('../utils/stablecoinYieldFeeEstimation', () => ({
    estimateYieldFeeLevel: jest.fn(),
}));

jest.mock('../../send/sendFormEthereumThunks', () => ({
    ethereumGetCurrentNonceThunk: jest.fn(() => () => {
        const result = { nonce: '5', confirmedNonce: '5' };

        return Object.assign(Promise.resolve(result), {
            unwrap: () => Promise.resolve(result),
        });
    }),
}));

const OWNER_ADDRESS = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326';
const VAULT_ADDRESS = '0xd63070114470f685b75B74D60EEc7c1113d33a3D';
const CALLDATA = '0xdeadbeef';

const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor(OWNER_ADDRESS),
    deviceState: 'mock@device:0',
});

// 1 gwei and 3 gwei, in wei — the raw shape the backend reports.
const normalLevel = { label: 'normal' as const, feePerUnit: '1000000000', blocks: -1 };
const highLevel = { label: 'high' as const, feePerUnit: '3000000000', blocks: -1 };

const buildFeeInfo = (levels: FeeInfo['levels']): FeeInfo => ({
    blockHeight: 100,
    blockTime: 12,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 1,
    levels,
});

const initStore = (feeInfo = buildFeeInfo([normalLevel])) =>
    configureMockStore({
        extra: undefined,
        reducer: combineReducers({
            device: () => deviceInitialState,
            wallet: combineReducers({
                accounts: () => accountsInitialState,
                blockchain: () => blockchainInitialState,
                fees: feesReducer,
                transactions: () => transactionsInitialState,
            }),
        }),
        preloadedState: {
            device: deviceInitialState,
            wallet: {
                accounts: accountsInitialState,
                blockchain: blockchainInitialState,
                fees: { eth: { status: 'loaded', data: feeInfo } },
                transactions: transactionsInitialState,
            },
        },
    });

const composeTransaction = async (
    payload: Parameters<typeof composeYieldEvmTransactionThunk>[0],
    feeInfo?: FeeInfo,
) => {
    const store = initStore(feeInfo);

    return await store.dispatch(composeYieldEvmTransactionThunk(payload)).unwrap();
};

const parseUnsignedTransaction = (
    result: Awaited<ReturnType<typeof composeTransaction>>,
): Record<string, unknown> => {
    if (result.type !== 'action-ready') {
        throw new Error(`Expected a composed transaction, got "${result.reason}".`);
    }

    return JSON.parse(result.unsignedTransaction);
};

describe(composeYieldEvmTransactionThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (estimateYieldFeeLevel as jest.Mock).mockResolvedValue({
            success: true,
            payload: { feeLimit: '750000' },
        });
    });

    it('prices the transaction with the normal fee level', async () => {
        const result = await composeTransaction(
            { account, to: VAULT_ADDRESS, data: CALLDATA },
            buildFeeInfo([highLevel, normalLevel]),
        );

        // 1 gwei, not the 3 gwei of the level that happens to come first.
        expect(parseUnsignedTransaction(result).gasPrice).toBe('0x3b9aca00');
    });

    it('falls back to the first fee level when the network reports no normal one', async () => {
        const result = await composeTransaction(
            { account, to: VAULT_ADDRESS, data: CALLDATA },
            buildFeeInfo([highLevel]),
        );

        expect(parseUnsignedTransaction(result).gasPrice).toBe('0xb2d05e00');
    });

    it('composes with the estimated gas limit, the current nonce and the account descriptor', async () => {
        const result = await composeTransaction({ account, to: VAULT_ADDRESS, data: CALLDATA });

        expect(parseUnsignedTransaction(result)).toMatchObject({
            chainId: 1,
            data: CALLDATA,
            from: OWNER_ADDRESS,
            gasLimit: '0xb71b0',
            nonce: 5,
            to: VAULT_ADDRESS,
            value: '0x0',
        });
    });

    it('carries a native value through to the transaction and to the fee estimation', async () => {
        const result = await composeTransaction({
            account,
            to: VAULT_ADDRESS,
            data: CALLDATA,
            value: '0xde0b6b3a7640000',
        });

        expect(parseUnsignedTransaction(result).value).toBe('0xde0b6b3a7640000');
        expect(estimateYieldFeeLevel).toHaveBeenCalledWith(
            expect.objectContaining({ value: '0xde0b6b3a7640000' }),
        );
    });

    it('fails when the fee estimation fails and no fallback gas limit is given', async () => {
        (estimateYieldFeeLevel as jest.Mock).mockResolvedValue({
            success: false,
            error: 'fee-estimation-failed',
        });

        const result = await composeTransaction({ account, to: VAULT_ADDRESS, data: CALLDATA });

        expect(result).toEqual({ type: 'error', reason: 'fee-estimation-failed' });
    });

    it('uses the fallback gas limit when the fee estimation fails', async () => {
        (estimateYieldFeeLevel as jest.Mock).mockResolvedValue({
            success: false,
            error: 'fee-estimation-failed',
        });

        const result = await composeTransaction({
            account,
            to: VAULT_ADDRESS,
            data: CALLDATA,
            gasLimitFallback: '45000',
        });

        expect(parseUnsignedTransaction(result).gasLimit).toBe('0xafc8');
    });

    it('fails for a non-EVM account', async () => {
        const bitcoinAccount = mockWalletAccount({
            symbol: asNetworkSymbol('btc'),
            deviceState: 'mock@device:0',
        });

        const result = await composeTransaction({
            account: bitcoinAccount,
            to: VAULT_ADDRESS,
            data: CALLDATA,
        });

        expect(result).toEqual({ type: 'error', reason: 'unsupported-network' });
        expect(estimateYieldFeeLevel).not.toHaveBeenCalled();
    });
});
