import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type TokenInfo } from '@trezor/connect';

import {
    type TrackWrappedNativeTokenThunkState,
    trackWrappedNativeTokenThunk,
} from './yieldWrapThunks';
import { accountsActions } from '../../accounts/accountsActions';
import { fetchWrappedNativeTokenInfo } from '../utils/fetchWrappedNativeTokenInfo';

jest.mock('../utils/fetchWrappedNativeTokenInfo', () => ({
    fetchWrappedNativeTokenInfo: jest.fn(),
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
    payload: Parameters<typeof trackWrappedNativeTokenThunk>[0] = {
        accountKey: ethereumAccount.key,
    },
) => {
    const { actions, dispatch } = createMockDispatch({ getState, extra: {} });
    const balance = await trackWrappedNativeTokenThunk(payload)(dispatch, getState, {}).unwrap();
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

        const { addTokensActions, balance } = await runThunk(() => buildState(bitcoinAccount), {
            accountKey: bitcoinAccount.key,
        });

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

    describe('ensure-tracked mode', () => {
        it('adds a zero-balance placeholder without fetching', async () => {
            const { addTokensActions, balance } = await runThunk(
                () => buildState(ethereumAccount),
                { accountKey: ethereumAccount.key, mode: 'ensure-tracked' },
            );

            expect(balance).toBe('0');
            expect(fetchWrappedNativeTokenInfoMock).not.toHaveBeenCalled();
            expect(addTokensActions).toEqual([
                expect.objectContaining({
                    payload: {
                        accountKey: ethereumAccount.key,
                        tokens: [
                            expect.objectContaining({
                                contract: WETH_ADDRESS,
                                symbol: 'WETH',
                                balance: '0',
                            }),
                        ],
                    },
                }),
            ]);
        });

        it('returns the tracked balance and adds nothing when the token is already tracked', async () => {
            const trackedAccount = {
                ...ethereumAccount,
                // stored in a different case to prove the dedupe is case-insensitive
                tokens: [
                    mockAccountToken({
                        contract: WETH_ADDRESS.toLowerCase(),
                        symbol: 'WETH',
                        balance: '1.5',
                    }),
                ],
            };

            const { addTokensActions, balance } = await runThunk(() => buildState(trackedAccount), {
                accountKey: ethereumAccount.key,
                mode: 'ensure-tracked',
            });

            expect(balance).toBe('1.5');
            expect(fetchWrappedNativeTokenInfoMock).not.toHaveBeenCalled();
            expect(addTokensActions).toHaveLength(0);
        });

        it('returns null for a non-ethereum account', async () => {
            const bitcoinAccount = mockWalletAccount({
                symbol: asNetworkSymbol('btc'),
                deviceState: 'mock@device:0',
            });

            const { addTokensActions, balance } = await runThunk(() => buildState(bitcoinAccount), {
                accountKey: bitcoinAccount.key,
                mode: 'ensure-tracked',
            });

            expect(balance).toBeNull();
            expect(addTokensActions).toHaveLength(0);
        });
    });
});
