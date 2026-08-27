import type { CryptoId } from 'invity-api';

import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { getInitializedTradingState } from '@suite-native/trading-fixtures';

import { useFormatCryptoValue } from './useFormatCryptoValue';

describe('useFormatCryptoValue', () => {
    const getPreloadedState = () => ({ wallet: { trading: getInitializedTradingState() } });

    const renderUseFormatCryptoValue = async () =>
        await renderHookWithStoreProvider(() => useFormatCryptoValue(), {
            preloadedState: getPreloadedState(),
        });

    it.each([
        [undefined, 'bitcoin' as CryptoId],
        ['1.5', undefined],
        ['1', 'unknown-crypto' as CryptoId],
    ])('returns undefined for value=%s cryptoId=%s', async (value, cryptoId) => {
        const { result } = await renderUseFormatCryptoValue();

        expect(result.current(value, cryptoId)).toBeUndefined();
    });

    it.each<[string, CryptoId, string]>([
        ['1.22', 'bitcoin' as CryptoId, '1.22 BTC'],
        [
            '10.1232',
            'solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL' as CryptoId,
            '10.1232 JTO',
        ],
    ])('formats %s %s as "%s"', async (value, cryptoId, expected) => {
        const { result } = await renderUseFormatCryptoValue();

        expect(result.current(value, cryptoId)).toBe(expected);
    });

    it.each<[string, CryptoId, string]>([
        // BTC has 8 decimals — 9th decimal is rounded
        ['0.123456789', 'bitcoin' as CryptoId, '0.12345679 BTC'],
        // Tokens are rounded to 16 decimals
        [
            '0.1234567890123456789',
            'solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL' as CryptoId,
            '0.1234567890123457 JTO',
        ],
    ])('respects network decimal precision for %s %s', async (value, cryptoId, expected) => {
        const { result } = await renderUseFormatCryptoValue();

        expect(result.current(value, cryptoId)).toBe(expected);
    });
});
