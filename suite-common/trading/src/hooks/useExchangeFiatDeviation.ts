import { type CryptoId } from 'invity-api';

import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { useTradingFiatValues } from './useTradingFiatValues';

const FIAT_DEVIATION_THRESHOLD_PERCENT = 10;
const FIAT_DEVIATION_HIGH_THRESHOLD_PERCENT = 20;

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

    const deviationPercent = ((sendFiatValue - receiveFiatValue) / sendFiatValue) * 100;

    return {
        deviation: deviationPercent,
        exceedsThreshold: deviationPercent >= FIAT_DEVIATION_THRESHOLD_PERCENT,
        exceedsHighThreshold: deviationPercent >= FIAT_DEVIATION_HIGH_THRESHOLD_PERCENT,
    };
};
