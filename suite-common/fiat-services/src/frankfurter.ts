import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { fetchUrl } from './fetch';

const FRANKFURTER_API_BASE_URL = 'https://api.frankfurter.dev/v2';

type FrankfurterRateResponse = {
    base: string;
    date: string;
    quote: string;
    rate: number;
};

export const fetchFiatExchangeRate = async ({
    baseCurrencyCode,
    quoteCurrencyCode,
}: {
    baseCurrencyCode: BaseCurrencyCode;
    quoteCurrencyCode: BaseCurrencyCode;
}): Promise<number | null> => {
    if (baseCurrencyCode === quoteCurrencyCode) {
        return 1;
    }

    try {
        const response = await fetchUrl(
            `${FRANKFURTER_API_BASE_URL}/rate/${baseCurrencyCode.toUpperCase()}/${quoteCurrencyCode.toUpperCase()}`,
        );

        if (!response.ok) {
            console.warn(`Frankfurter: exchange rate failed to fetch: ${response.status}`);

            return null;
        }

        const payload = (await response.json()) as FrankfurterRateResponse;

        return typeof payload.rate === 'number' ? payload.rate : null;
    } catch (error) {
        console.warn(error);

        return null;
    }
};
