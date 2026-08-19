import { combineReducers } from '@reduxjs/toolkit';

import { deviceInitialState } from '@suite-common/device';
import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type FeeInfo, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import {
    type TrackWrappedNativeTokenThunkState,
    composeYieldWrapTransactionThunk,
    trackWrappedNativeTokenThunk,
} from './stablecoinYieldWrapThunks';
import { accountsActions } from '../../accounts/accountsActions';
import { accountsInitialState } from '../../accounts/accountsReducer';
import { blockchainInitialState } from '../../blockchain/blockchainReducer';
import { feesReducer } from '../../fees/feesReducer';
import { transactionsInitialState } from '../../transactions/transactionsReducer';
import { fetchWrappedNativeTokenInfo } from '../utils/fetchWrappedNativeTokenInfo';
import { estimateYieldFeeLevel } from '../utils/stablecoinYieldFeeEstimation';

jest.mock('../utils/fetchWrappedNativeTokenInfo', () => ({
    fetchWrappedNativeTokenInfo: jest.fn(),
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

const fetchWrappedNativeTokenInfoMock = jest.mocked(fetchWrappedNativeTokenInfo);

const OWNER_ADDRESS = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326';
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

const ethereumAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor(OWNER_ADDRESS),
    deviceState: 'mock@device:0',
});

const wethTokenInfo: TokenInfo = {
    standard: 'ERC20',
    contract: WETH_ADDRESS,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    balance: '2500000000000000000',
};

const buildState = (account: Account): TrackWrappedNativeTokenThunkState => ({
    wallet: { accounts: [account] },
});

const runThunk = async (
    getState: () => TrackWrappedNativeTokenThunkState,
    accountKey = ethereumAccount.key,
) => {
    const { actions, dispatch } = createMockDispatch({ getState, extra: {} });
    const balance = await trackWrappedNativeTokenThunk({ accountKey })(
        dispatch,
        getState,
        {},
    ).unwrap();
    const addTokensActions = actions.filter(action =>
        accountsActions.addAccountTokens.match(action),
    );

    return { addTokensActions, balance };
};

describe('trackWrappedNativeTokenThunk', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('fetches an untracked wrapped-native token and starts tracking its positive balance', async () => {
        fetchWrappedNativeTokenInfoMock.mockResolvedValue(wethTokenInfo);

        const { addTokensActions, balance } = await runThunk(() => buildState(ethereumAccount));

        expect(balance).toBe('2.5');
        expect(addTokensActions).toEqual([
            expect.objectContaining({
                payload: {
                    accountKey: ethereumAccount.key,
                    tokens: [
                        expect.objectContaining({
                            contract: WETH_ADDRESS,
                            symbol: 'WETH',
                            balance: '2.5',
                        }),
                    ],
                },
            }),
        ]);
    });

    it('returns the tracked balance without refetching when the token is already tracked', async () => {
        const trackedAccount = {
            ...ethereumAccount,
            tokens: [
                mockAccountToken({
                    contract: WETH_ADDRESS.toLowerCase(),
                    symbol: 'WETH',
                    balance: '1.5',
                }),
            ],
        };

        const { addTokensActions, balance } = await runThunk(() => buildState(trackedAccount));

        expect(balance).toBe('1.5');
        expect(fetchWrappedNativeTokenInfoMock).not.toHaveBeenCalled();
        expect(addTokensActions).toHaveLength(0);
    });

    it('does not track a zero balance', async () => {
        fetchWrappedNativeTokenInfoMock.mockResolvedValue({ ...wethTokenInfo, balance: '0' });

        const { addTokensActions, balance } = await runThunk(() => buildState(ethereumAccount));

        expect(balance).toBe('0');
        expect(addTokensActions).toHaveLength(0);
    });

    it('returns null when the backend does not report the token', async () => {
        fetchWrappedNativeTokenInfoMock.mockResolvedValue(null);

        const { addTokensActions, balance } = await runThunk(() => buildState(ethereumAccount));

        expect(balance).toBeNull();
        expect(addTokensActions).toHaveLength(0);
    });

    it('returns null when the fetch fails', async () => {
        fetchWrappedNativeTokenInfoMock.mockRejectedValue(new Error('Backend unavailable.'));

        const { addTokensActions, balance } = await runThunk(() => buildState(ethereumAccount));

        expect(balance).toBeNull();
        expect(addTokensActions).toHaveLength(0);
    });

    it('returns null for a non-ethereum account', async () => {
        const bitcoinAccount = mockWalletAccount({
            symbol: asNetworkSymbol('btc'),
            deviceState: 'mock@device:0',
        });

        const { addTokensActions, balance } = await runThunk(
            () => buildState(bitcoinAccount),
            bitcoinAccount.key,
        );

        expect(balance).toBeNull();
        expect(fetchWrappedNativeTokenInfoMock).not.toHaveBeenCalled();
        expect(addTokensActions).toHaveLength(0);
    });

    it('adds only the wrapped-native token when another token was tracked during the fetch', async () => {
        let state = buildState(ethereumAccount);
        fetchWrappedNativeTokenInfoMock.mockImplementation(() => {
            state = buildState({
                ...ethereumAccount,
                tokens: [mockAccountToken({ contract: USDC_ADDRESS, symbol: 'USDC' })],
            });

            return Promise.resolve(wethTokenInfo);
        });

        const { addTokensActions, balance } = await runThunk(() => state);

        expect(balance).toBe('2.5');
        expect(addTokensActions).toEqual([
            expect.objectContaining({
                payload: {
                    accountKey: ethereumAccount.key,
                    tokens: [expect.objectContaining({ contract: WETH_ADDRESS })],
                },
            }),
        ]);
    });

    it('does not create a duplicate when the token got tracked during the fetch', async () => {
        let state = buildState(ethereumAccount);
        fetchWrappedNativeTokenInfoMock.mockImplementation(() => {
            state = buildState({
                ...ethereumAccount,
                tokens: [mockAccountToken({ contract: WETH_ADDRESS, symbol: 'WETH' })],
            });

            return Promise.resolve(wethTokenInfo);
        });

        const { addTokensActions, balance } = await runThunk(() => state);

        expect(balance).toBe('2.5');
        expect(addTokensActions).toHaveLength(0);
    });
});

// 1 Gwei, raw — the thunk converts it to Gwei itself.
const ethFeeInfo: FeeInfo = {
    blockHeight: 100,
    blockTime: 12,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 1,
    levels: [{ label: 'normal', feePerUnit: '1000000000', blocks: -1 }],
};

// The balance from the "insufficient funds for gas * price + value" report: wrapping all of it
// leaves nothing for the fee, which is paid out of the very same balance.
const WHOLE_BALANCE_WEI = '885386728109194';
const WHOLE_BALANCE = '0.000885386728109194';
// 60000 gas at 1 Gwei.
const WRAP_FEE_WEI = '60000000000000';

const wrapAccount: Account = {
    ...ethereumAccount,
    availableBalance: WHOLE_BALANCE_WEI,
    formattedBalance: WHOLE_BALANCE,
};

const initWrapStore = () =>
    configureMockStore({
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

const composeWrap = (wrapAmount: string) =>
    initWrapStore()
        .dispatch(
            composeYieldWrapTransactionThunk({
                account: wrapAccount,
                token: { contractAddress: WETH_ADDRESS, decimals: 18 },
                wrapAmount,
            }),
        )
        .unwrap();

describe('composeYieldWrapTransactionThunk', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (estimateYieldFeeLevel as jest.Mock).mockResolvedValue({
            success: true,
            payload: { feeLimit: '60000' },
        });
    });

    it('refuses to compose a wrap of the whole balance, which cannot cover its own fee', async () => {
        await expect(composeWrap(WHOLE_BALANCE)).resolves.toEqual({
            type: 'error',
            reason: 'insufficient-native-balance',
        });
    });

    it('refuses to compose when the amount leaves less than the fee behind', async () => {
        const justUnderTheFee = new BigNumber(WHOLE_BALANCE_WEI)
            .minus(WRAP_FEE_WEI)
            .plus(1)
            .shiftedBy(-18)
            .toFixed();

        await expect(composeWrap(justUnderTheFee)).resolves.toEqual({
            type: 'error',
            reason: 'insufficient-native-balance',
        });
    });

    it('composes the largest amount the balance can still fund', async () => {
        const maxFundable = new BigNumber(WHOLE_BALANCE_WEI)
            .minus(WRAP_FEE_WEI)
            .shiftedBy(-18)
            .toFixed();

        const result = await composeWrap(maxFundable);

        expect(result.type).toBe('action-ready');
    });
});
