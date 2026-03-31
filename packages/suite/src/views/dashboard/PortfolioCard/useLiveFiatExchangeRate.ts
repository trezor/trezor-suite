import { useEffect, useMemo, useState } from 'react';

import { fetchFiatExchangeRate } from '@suite-common/fiat-services';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';

import { useSelector } from 'src/hooks/suite';

const LIVE_FIAT_RATE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const liveFiatRateCache = new Map<string, { rate: number; fetchedAt: number }>();

export const useLiveFiatExchangeRate = (enabled: boolean) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const liveCurrencyCode =
        isFiatBaseCurrencyCode(baseCurrencyCode) && baseCurrencyCode !== 'usd'
            ? baseCurrencyCode
            : 'usd';
    const [exchangeRate, setExchangeRate] = useState<number | null>(
        liveCurrencyCode === 'usd' ? 1 : null,
    );

    useEffect(() => {
        let isActive = true;

        if (!enabled || liveCurrencyCode === 'usd') {
            setExchangeRate(1);

            return;
        }

        const cached = liveFiatRateCache.get(liveCurrencyCode);
        if (cached !== undefined && Date.now() - cached.fetchedAt < LIVE_FIAT_RATE_CACHE_TTL_MS) {
            setExchangeRate(cached.rate);

            return;
        }

        setExchangeRate(null);

        fetchFiatExchangeRate({
            baseCurrencyCode: 'usd',
            quoteCurrencyCode: liveCurrencyCode,
        }).then(rate => {
            if (!isActive || rate === null) {
                return;
            }

            liveFiatRateCache.set(liveCurrencyCode, { rate, fetchedAt: Date.now() });
            setExchangeRate(rate);
        });

        return () => {
            isActive = false;
        };
    }, [enabled, liveCurrencyCode]);

    return useMemo(
        () => ({
            exchangeRate,
            isLoading: enabled && liveCurrencyCode !== 'usd' && exchangeRate === null,
            liveCurrencyCode,
        }),
        [enabled, exchangeRate, liveCurrencyCode],
    );
};
