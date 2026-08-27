import { combineReducers } from '@reduxjs/toolkit';

import { deviceInitialState } from '@suite-common/device';
import { configureMockStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { composeYieldWithdrawTransactionThunk } from './stablecoinYieldWithdrawThunks';
import { accountsInitialState } from '../../accounts/accountsReducer';
import { blockchainInitialState } from '../../blockchain/blockchainReducer';
import { feesReducer } from '../../fees/feesReducer';
import { transactionsInitialState } from '../../transactions/transactionsReducer';
import { type YieldFlowResolvedData } from '../stablecoinYieldTypes';
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
const RECEIPT_TOKEN_ADDRESS = '0xd63070114470f685b75B74D60EEc7c1113d33a3D';
const VAULT_OUTPUT_TOKEN_ADDRESS = '0x83F20F44975D03b1b09e64809B757c47f942BEeA';

const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor(OWNER_ADDRESS),
    deviceState: 'mock@device:0',
});

const buildFlowData = (overrides: Record<string, unknown> = {}) =>
    ({
        account,
        vault: {
            id: `eth-${VAULT_OUTPUT_TOKEN_ADDRESS}`,
            chainId: 1,
            outputToken: { address: VAULT_OUTPUT_TOKEN_ADDRESS },
        },
        token: {
            networkSymbol: 'eth',
            symbol: 'usdc',
            decimals: 6,
            contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            balance: '100',
        },
        receiptToken: {
            networkSymbol: 'eth',
            symbol: 'musdc',
            decimals: 18,
            contractAddress: RECEIPT_TOKEN_ADDRESS,
        },
        ...overrides,
    }) as unknown as YieldFlowResolvedData;

const ethFeeInfo: FeeInfo = {
    blockHeight: 100,
    blockTime: 12,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 1,
    levels: [{ label: 'normal', feePerUnit: '1000000000', blocks: -1 }],
};

const initStore = () =>
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
                fees: { eth: { status: 'loaded', data: ethFeeInfo } },
                transactions: transactionsInitialState,
            },
        },
    });

const composeWithdraw = async (
    payload: Parameters<typeof composeYieldWithdrawTransactionThunk>[0],
) => {
    const store = initStore();

    return await store.dispatch(composeYieldWithdrawTransactionThunk(payload)).unwrap();
};

describe(composeYieldWithdrawTransactionThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (estimateYieldFeeLevel as jest.Mock).mockResolvedValue({
            success: true,
            payload: { feeLimit: '750000' },
        });
    });

    it('sends the withdraw to the vault the receipt token identifies', async () => {
        const result = await composeWithdraw({
            flowData: buildFlowData(),
            amount: '1',
            flowType: 'withdraw',
        });

        expect(result.type).toBe('action-ready');

        if (result.type === 'action-ready') {
            expect(JSON.parse(result.unsignedTransaction)).toMatchObject({
                to: RECEIPT_TOKEN_ADDRESS,
                gasLimit: '0xb71b0',
                nonce: 5,
            });
        }
    });

    it('falls back to the vault output token when the receipt token has no contract address', async () => {
        const result = await composeWithdraw({
            flowData: buildFlowData({
                receiptToken: {
                    networkSymbol: 'eth',
                    symbol: 'musdc',
                    decimals: 18,
                    contractAddress: null,
                },
            }),
            amount: '1',
            flowType: 'withdraw',
        });

        expect(result.type).toBe('action-ready');

        if (result.type === 'action-ready') {
            expect(JSON.parse(result.unsignedTransaction).to).toBe(VAULT_OUTPUT_TOKEN_ADDRESS);
        }
    });

    it('fails when no vault address can be resolved', async () => {
        const result = await composeWithdraw({
            flowData: buildFlowData({
                vault: { id: 'eth-vault', chainId: 1 },
                receiptToken: {
                    networkSymbol: 'eth',
                    symbol: 'musdc',
                    decimals: 18,
                    contractAddress: null,
                },
            }),
            amount: '1',
            flowType: 'withdraw',
        });

        expect(result).toEqual({ type: 'error', reason: 'missing-vault-address' });
        expect(estimateYieldFeeLevel).not.toHaveBeenCalled();
    });

    it('fails when the vault lives on another chain', async () => {
        const result = await composeWithdraw({
            flowData: buildFlowData({
                vault: {
                    id: `eth-${VAULT_OUTPUT_TOKEN_ADDRESS}`,
                    chainId: 137,
                    outputToken: { address: VAULT_OUTPUT_TOKEN_ADDRESS },
                },
            }),
            amount: '1',
            flowType: 'withdraw',
        });

        expect(result).toEqual({ type: 'error', reason: 'vault-chain-mismatch' });
        expect(estimateYieldFeeLevel).not.toHaveBeenCalled();
    });

    it('fails for a non-EVM account', async () => {
        const bitcoinAccount = mockWalletAccount({
            symbol: asNetworkSymbol('btc'),
            deviceState: 'mock@device:0',
        });

        const result = await composeWithdraw({
            flowData: buildFlowData({ account: bitcoinAccount }),
            amount: '1',
            flowType: 'withdraw',
        });

        expect(result).toEqual({ type: 'error', reason: 'unsupported-network' });
    });

    it('fails when the fee estimation fails', async () => {
        (estimateYieldFeeLevel as jest.Mock).mockResolvedValue({
            success: false,
            error: 'fee-estimation-failed',
        });

        const result = await composeWithdraw({
            flowData: buildFlowData(),
            amount: '1',
            flowType: 'withdraw',
        });

        expect(result).toEqual({ type: 'error', reason: 'fee-estimation-failed' });
    });

    it('encodes redeem against the share amount, not the asset amount', async () => {
        const withdrawResult = await composeWithdraw({
            flowData: buildFlowData(),
            amount: '1',
            flowType: 'withdraw',
        });
        const redeemResult = await composeWithdraw({
            flowData: buildFlowData(),
            amount: '1',
            flowType: 'redeem',
        });

        expect(withdrawResult.type).toBe('action-ready');
        expect(redeemResult.type).toBe('action-ready');

        if (withdrawResult.type === 'action-ready' && redeemResult.type === 'action-ready') {
            const withdrawData = JSON.parse(withdrawResult.unsignedTransaction).data;
            const redeemData = JSON.parse(redeemResult.unsignedTransaction).data;

            expect(withdrawData).not.toBe(redeemData);
        }
    });
});
