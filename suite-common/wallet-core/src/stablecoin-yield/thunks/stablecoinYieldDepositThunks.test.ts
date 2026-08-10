import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { BigNumber } from '@trezor/utils';

import { composeYieldDepositTransactionThunk } from './stablecoinYieldDepositThunks';
import { accountsInitialState } from '../../accounts/accountsReducer';
import { fetchAllowance } from '../../allowance/fetchAllowance';
import { feesReducer } from '../../fees/feesReducer';
import { ethereumGetCurrentNonceThunk } from '../../send/sendFormEthereumThunks';
import { transactionsInitialState } from '../../transactions/transactionsReducer';
import { type YieldFlowResolvedData } from '../stablecoinYieldTypes';
import { estimateYieldFeeLevel } from '../utils/stablecoinYieldFeeEstimation';

jest.mock('../../allowance/fetchAllowance', () => ({
    fetchAllowance: jest.fn(),
}));

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

const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor(OWNER_ADDRESS),
    deviceState: 'mock@device:0',
});

const flowData = {
    account,
    vault: { id: `eth-${VAULT_ADDRESS}`, chainId: 1 },
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
        contractAddress: VAULT_ADDRESS,
    },
} as unknown as YieldFlowResolvedData;

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
        reducer: combineReducers({
            wallet: combineReducers({
                accounts: () => accountsInitialState,
                fees: feesReducer,
                transactions: () => transactionsInitialState,
            }),
        }),
        preloadedState: {
            wallet: {
                accounts: accountsInitialState,
                fees: { eth: { status: 'loaded', data: ethFeeInfo } },
                transactions: transactionsInitialState,
            },
        },
    });

describe(composeYieldDepositTransactionThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetchAllowance as jest.Mock).mockResolvedValue(new BigNumber('1000000000000'));
    });

    it('fails with fee-estimation-failed when gas estimation fails', async () => {
        (estimateYieldFeeLevel as jest.Mock).mockResolvedValue({
            success: false,
            error: 'Network error',
        });

        const store = initStore();
        const result = await store
            .dispatch(composeYieldDepositTransactionThunk({ flowData, amount: '1' }))
            .unwrap();

        expect(result).toEqual({ type: 'error', reason: 'fee-estimation-failed' });
    });

    it('uses the estimated gas limit when estimation succeeds', async () => {
        (estimateYieldFeeLevel as jest.Mock).mockResolvedValue({
            success: true,
            payload: { feeLimit: '750000' },
        });

        const store = initStore();
        const result = await store
            .dispatch(composeYieldDepositTransactionThunk({ flowData, amount: '1' }))
            .unwrap();

        expect(result.type).toBe('action-ready');

        if (result.type === 'action-ready') {
            expect(JSON.parse(result.unsignedTransaction).gasLimit).toBe('0xb71b0');
        }

        expect(ethereumGetCurrentNonceThunk).toHaveBeenCalledWith({
            selectedAccount: account,
            fetchConfirmedNonce: true,
        });
    });
});
