import { type CryptoId } from 'invity-api';

import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { useTradingFiatValues } from './useTradingFiatValues';

const FIAT_DEVIATION_THRESHOLD_RATIO = 0.1;
const FIAT_DEVIATION_HIGH_THRESHOLD_RATIO = 0.2;

type ExchangeFiatDeviationProps = {
    sendCryptoId?: CryptoId;
    sendAmount?: string;
    receiveCryptoId?: CryptoId;
    receiveAmount?: string;
    fiatCurrency?: BaseCurrencyCode;
};

export type FiatDeviationResult = {
    deviation: number;
    exceedsThreshold: boolean;
    exceedsHighThreshold: boolean;
};

const parseFiatValue = (value: string | undefined | null): number | null => {
    if (!value) return null;
    const n = Number(value);

    return Number.isFinite(n) && n > 0 ? n : null;
};

export const useExchangeFiatDeviation = ({
    sendCryptoId,
    sendAmount,
    receiveCryptoId,
    receiveAmount,
    fiatCurrency,
}: ExchangeFiatDeviationProps): FiatDeviationResult | null => {
    const sendFiat = useTradingFiatValues({
        cryptoId: sendCryptoId,
        fiatCurrency,
        amount: sendAmount,
    });

    const receiveFiat = useTradingFiatValues({
        cryptoId: receiveCryptoId,
        fiatCurrency,
        amount: receiveAmount,
    });

    const sendFiatValue = parseFiatValue(sendFiat?.fiatValue);
    const receiveFiatValue = parseFiatValue(receiveFiat?.fiatValue);

    if (sendFiatValue === null || receiveFiatValue === null) {
        return null;
    }

    const deviation = (sendFiatValue - receiveFiatValue) / sendFiatValue;

    return {
        deviation,
        exceedsThreshold: deviation >= FIAT_DEVIATION_THRESHOLD_RATIO,
        exceedsHighThreshold: deviation >= FIAT_DEVIATION_HIGH_THRESHOLD_RATIO,
    };
};
