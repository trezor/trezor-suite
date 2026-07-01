import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { StaticSessionId } from '@trezor/connect';

import { useTradingFormAccount } from '../useTradingFormAccount';

const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';

const FIRST_ELIGIBLE_ACCOUNT: Account = mockWalletAccount({
    symbol: 'eth',
    descriptor: asAccountDescriptor('0xFirstEligible'),
    balance: '1000000000000000000',
});
const TRADE_ACCOUNT: Account = mockWalletAccount({
    symbol: 'eth',
    descriptor: asAccountDescriptor('0xTradeAccount'),
    balance: '2000000000000000000',
});
const INELIGIBLE_TRADE_ACCOUNT: Account = mockWalletAccount({
    symbol: 'eth',
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
        preloadedState: buildState(accounts, sellTradingAccountKey),
    });
    const { result } = renderHookWithStoreProvider(() => useTradingFormAccount('sell'), { store });

    return result;
};

describe('useTradingFormAccount – sell account across redirect', () => {
    it('resolves a fallback account (not the trade account) when tradingAccountKey is lost', () => {
        const result = renderForSell(undefined);

        expect(result.current.account.key).toBe(FIRST_ELIGIBLE_ACCOUNT.key);
        expect(result.current.account.key).not.toBe(TRADE_ACCOUNT.key);
    });

    it('resolves the trade account when tradingAccountKey is rehydrated from the trade', () => {
        const result = renderForSell(TRADE_ACCOUNT.key);

        expect(result.current.account.key).toBe(TRADE_ACCOUNT.key);
    });

    it('discards the rehydrated tradingAccountKey when the trade account is not eligible', () => {
        // Restoring tradingAccountKey from trade.sendAccountKey is not enough on its own:
        // useTradingFormAccount runs the key through the eligibility resolver and drops it
        // when the account has no balance/tokens, falling back to a different eligible
        // account. This is why post-trade steps derive the account directly from
        // trade.sendAccountKey (see useTradingSellForm / useTradingExchangeForm) instead of
        // relying on this resolver.
        const result = renderForSell(INELIGIBLE_TRADE_ACCOUNT.key, [
            FIRST_ELIGIBLE_ACCOUNT,
            INELIGIBLE_TRADE_ACCOUNT,
        ]);

        expect(result.current.account.key).not.toBe(INELIGIBLE_TRADE_ACCOUNT.key);
        expect(result.current.account.key).toBe(FIRST_ELIGIBLE_ACCOUNT.key);
    });
});
