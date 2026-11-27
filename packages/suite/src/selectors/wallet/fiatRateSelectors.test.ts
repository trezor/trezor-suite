import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    type WalletSettingsRootState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import { type CurrentRate, type Rate, asTimestamp } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import { selectFiatRateForCryptoValue } from './fiatRateSelectors';

type State = FiatRatesRootState & WalletSettingsRootState;

const symbol = asNetworkSymbol('eth');
const TOKEN = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

const coinKey = getFiatRateKey(symbol, 'usd');
const tokenKey = getFiatRateKey(symbol, 'usd', TOKEN);

const status = {
    lastTickerTimestamp: asTimestamp(1),
    lastSuccessfulFetchTimestamp: asTimestamp(1),
    isLoading: false,
    error: null,
    ticker: { symbol },
};

const currentRate = (rate: number): CurrentRate => ({ ...status, rate, usdRate: rate });
const lastWeekRate = (rate: number): Rate => ({ ...status, rate });

const createState = (current: State['wallet']['fiat']['current']): State => ({
    wallet: {
        settings: initialWalletSettingsState,
        fiat: {
            current,
            lastWeek: { [coinKey]: lastWeekRate(90) },
            historic: {},
        },
    },
});

describe('selectFiatRateForCryptoValue', () => {
    it('returns the current rate in the base currency', () => {
        const state = createState({ [coinKey]: currentRate(100) });

        expect(selectFiatRateForCryptoValue(state, { symbol })).toBe(100);
    });

    it('returns the token rate for a token address', () => {
        const state = createState({ [coinKey]: currentRate(100), [tokenKey]: currentRate(1) });

        expect(selectFiatRateForCryptoValue(state, { symbol, tokenAddress: TOKEN })).toBe(1);
    });

    it('reads the requested rate type', () => {
        const state = createState({ [coinKey]: currentRate(100) });

        expect(selectFiatRateForCryptoValue(state, { symbol, rateType: 'lastWeek' })).toBe(90);
    });

    it('stays the same when a fetch changes only the status and timestamps', () => {
        const before = createState({ [coinKey]: currentRate(100) });
        const after = createState({
            [coinKey]: {
                ...currentRate(100),
                isLoading: true,
                lastTickerTimestamp: asTimestamp(2),
                lastSuccessfulFetchTimestamp: asTimestamp(2),
            },
        });

        expect(selectFiatRateForCryptoValue(after, { symbol })).toBe(
            selectFiatRateForCryptoValue(before, { symbol }),
        );
    });

    it('returns the historic rate and ignores the current one', () => {
        const params = { symbol, historicRate: 50, useHistoricRate: true };

        expect(
            selectFiatRateForCryptoValue(createState({ [coinKey]: currentRate(100) }), params),
        ).toBe(50);
        expect(
            selectFiatRateForCryptoValue(createState({ [coinKey]: currentRate(110) }), params),
        ).toBe(50);
    });

    it('returns undefined without a rate', () => {
        expect(selectFiatRateForCryptoValue(createState({}), { symbol })).toBeUndefined();
    });
});
