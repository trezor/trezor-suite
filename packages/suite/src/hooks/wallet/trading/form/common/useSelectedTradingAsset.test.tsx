import { type CryptoId } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { StaticSessionId } from '@trezor/connect';

import { useSelectedTradingAsset } from './useSelectedTradingAsset';

const ethSymbol = asNetworkSymbol('eth');

const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';

const ELIGIBLE_ACCOUNT: Account = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('0xEligible'),
    balance: '1000000000000000000',
    formattedBalance: '1',
});
const INELIGIBLE_ACCOUNT: Account = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('0xIneligible'),
    balance: '0',
    tokens: [],
});

const TOKEN_CRYPTO_ID = 'ethereum--0xTokenContract' as CryptoId;

const buildState = (
    accounts: Account[],
    tradingAccountKey?: string,
    prefilled: { key?: string; cryptoId?: CryptoId } = { key: undefined, cryptoId: undefined },
) => ({
    device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
    tokenDefinitions: {},
    wallet: {
        accounts,
        trading: {
            sell: { tradingAccountKey },
            buy: { tradingAccountKey },
            exchange: { tradingAccountKey: undefined },
            prefilledFromAccount: prefilled,
        },
    },
});

describe('useSelectedTradingAsset', () => {
    it('returns undefined when no eligible account is selected', () => {
        const store = configureMockStore({
            preloadedState: buildState([INELIGIBLE_ACCOUNT]),
        });
        const { result } = renderHookWithStoreProvider(() => useSelectedTradingAsset('sell'), {
            store,
        });

        expect(result.current).toBeUndefined();
    });

    it('returns the native asset view-model when a native account is selected', () => {
        const store = configureMockStore({
            preloadedState: buildState([ELIGIBLE_ACCOUNT], ELIGIBLE_ACCOUNT.key),
        });
        const { result } = renderHookWithStoreProvider(() => useSelectedTradingAsset('sell'), {
            store,
        });

        expect(result.current).toEqual({
            symbol: 'eth',
            decimals: getNetwork(ethSymbol).decimals,
            balance: ELIGIBLE_ACCOUNT.balance,
            formattedBalance: ELIGIBLE_ACCOUNT.formattedBalance,
            tokens: ELIGIBLE_ACCOUNT.tokens,
            cryptoId: getNetwork(ethSymbol).tradeCryptoId,
            isToken: false,
        });
    });

    it('flags a prefilled token as a token asset', () => {
        const store = configureMockStore({
            preloadedState: buildState([ELIGIBLE_ACCOUNT], ELIGIBLE_ACCOUNT.key, {
                key: ELIGIBLE_ACCOUNT.key,
                cryptoId: TOKEN_CRYPTO_ID,
            }),
        });
        const { result } = renderHookWithStoreProvider(() => useSelectedTradingAsset('buy'), {
            store,
        });

        expect(result.current?.cryptoId).toBe(TOKEN_CRYPTO_ID);
        expect(result.current?.isToken).toBe(true);
    });
});
