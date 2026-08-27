import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { StaticSessionId } from '@trezor/connect';

import { useTradingFormAccount } from './useTradingFormAccount';

const ethSymbol = asNetworkSymbol('eth');

const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';

const FIRST_ELIGIBLE_ACCOUNT: Account = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('0xFirstEligible'),
    balance: '1000000000000000000',
});
const TRADE_ACCOUNT: Account = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('0xTradeAccount'),
    balance: '2000000000000000000',
});
const INELIGIBLE_TRADE_ACCOUNT: Account = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('0xIneligibleTradeAccount'),
    balance: '0',
    tokens: [],
});

const buildState = (accounts: Account[], sellTradingAccountKey?: string) => ({
    device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
    tokenDefinitions: {},
    wallet: {
        accounts,
        trading: {
            sell: { tradingAccountKey: sellTradingAccountKey },
            buy: { tradingAccountKey: undefined },
            exchange: { tradingAccountKey: undefined },
            prefilledFromAccount: { key: undefined, cryptoId: undefined },
        },
    },
});

const renderForSell = (
    sellTradingAccountKey?: string,
    accounts: Account[] = [FIRST_ELIGIBLE_ACCOUNT, TRADE_ACCOUNT],
) => {
    const store = configureMockStore({
        extra: undefined,
        preloadedState: buildState(accounts, sellTradingAccountKey),
    });
    const { result } = renderHookWithStoreProvider(() => useTradingFormAccount('sell'), { store });

    return result;
};

describe('useTradingFormAccount – sell account across redirect', () => {
    it('preselects the first eligible account when tradingAccountKey is lost and none is prefilled', () => {
        const result = renderForSell(undefined);

        expect(result.current.account?.key).toBe(FIRST_ELIGIBLE_ACCOUNT.key);
    });

    it('resolves the trade account when tradingAccountKey is rehydrated from the trade', () => {
        const result = renderForSell(TRADE_ACCOUNT.key);

        expect(result.current.account?.key).toBe(TRADE_ACCOUNT.key);
    });

    it('falls back to a same-symbol eligible account when the rehydrated trade account is not eligible', () => {
        const result = renderForSell(INELIGIBLE_TRADE_ACCOUNT.key, [
            FIRST_ELIGIBLE_ACCOUNT,
            INELIGIBLE_TRADE_ACCOUNT,
        ]);

        expect(result.current.account?.key).not.toBe(INELIGIBLE_TRADE_ACCOUNT.key);
        expect(result.current.account?.key).toBe(FIRST_ELIGIBLE_ACCOUNT.key);
    });

    it('resolves no account when the preferred account is not eligible and no same-symbol account qualifies', () => {
        const result = renderForSell(INELIGIBLE_TRADE_ACCOUNT.key, [INELIGIBLE_TRADE_ACCOUNT]);

        expect(result.current.account).toBeUndefined();
    });
});
