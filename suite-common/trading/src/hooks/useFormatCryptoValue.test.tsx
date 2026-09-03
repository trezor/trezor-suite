import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';

import { type Coins, type CryptoId } from 'invity-api';

import { MockedFormatterProvider } from '@suite-common/formatters/mocks';

import { useFormatCryptoValue } from './useFormatCryptoValue';
import { createTradingTestState, renderHookWithTradingStore } from '../test-utils/testUtils';

const FormattersProvider = ({ children }: PropsWithChildren) => (
    <IntlProvider locale="en">
        <MockedFormatterProvider>{children}</MockedFormatterProvider>
    </IntlProvider>
);

const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;
const USDC_CRYPTO_ID = 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId;

const coins = {
    bitcoin: {
        symbol: 'btc',
        name: 'Bitcoin',
        coingeckoId: 'bitcoin',
        services: { buy: true, sell: true, exchange: true },
    },
    'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
        symbol: 'usdc',
        name: 'USDC',
        coingeckoId: 'usd-coin',
        services: { buy: true, sell: true, exchange: true },
    },
} satisfies Coins;

describe('useFormatCryptoValue', () => {
    const renderUseFormatCryptoValue = () =>
        renderHookWithTradingStore(() => useFormatCryptoValue(), {
            preloadedState: createTradingTestState({ info: { coins, platforms: undefined } }),
            wrapper: FormattersProvider,
        });

    it.each([
        [undefined, BITCOIN_CRYPTO_ID],
        ['1.5', undefined],
        ['1', 'unknown-crypto' as CryptoId],
    ])('returns undefined for value=%s cryptoId=%s', (value, cryptoId) => {
        const { result } = renderUseFormatCryptoValue();

        expect(result.current(value, cryptoId)).toBeUndefined();
    });

    it.each<[string, CryptoId, string]>([
        ['1.22', BITCOIN_CRYPTO_ID, '1.22 BTC'],
        ['10.1232', USDC_CRYPTO_ID, '10.1232 USDC'],
    ])('formats %s %s as "%s"', (value, cryptoId, expected) => {
        const { result } = renderUseFormatCryptoValue();

        expect(result.current(value, cryptoId)).toBe(expected);
    });

    it.each<[string, CryptoId, string]>([
        // BTC has 8 decimals — extra precision is truncated
        ['0.123456789', BITCOIN_CRYPTO_ID, '0.12345678 BTC'],
        // Tokens are truncated to 16 decimals
        ['0.1234567890123456789', USDC_CRYPTO_ID, '0.1234567890123456 USDC'],
    ])('respects network decimal precision for %s %s', (value, cryptoId, expected) => {
        const { result } = renderUseFormatCryptoValue();

        expect(result.current(value, cryptoId)).toBe(expected);
    });
});
