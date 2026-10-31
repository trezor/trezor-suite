import { useCallback } from 'react';

import type { CryptoId } from 'invity-api';

import { type CryptoAmountFormatterFormatStyle, useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol, getNetworkDecimals } from '@suite-common/wallet-config';

import { useTradingUtils } from './useTradingUtils';

const TOKEN_DECIMALS_LENGTH = 16;

export type UseFormatCryptoValueParams = {
    formatStyle?: CryptoAmountFormatterFormatStyle;
};

export const useFormatCryptoValue = ({ formatStyle }: UseFormatCryptoValueParams = {}) => {
    const { CryptoAmountFormatter } = useFormatters();
    const { cryptoIdToCoinSymbol } = useTradingUtils();

    return useCallback(
        (
            value: string | undefined,
            cryptoId: CryptoId | undefined,
            smallestUnitsOverride?: boolean,
        ): string | undefined => {
            if (value === undefined || cryptoId === undefined) {
                return undefined;
            }

            const coinSymbol = cryptoIdToCoinSymbol(cryptoId);
            if (!coinSymbol) {
                return undefined;
            }
            const networkDecimals = coinSymbol ? getNetworkDecimals(coinSymbol) : undefined;

            return CryptoAmountFormatter.format(value, {
                maxDisplayedDecimals: networkDecimals ?? TOKEN_DECIMALS_LENGTH,
                isBalance: true,
                symbol: coinSymbol as NetworkSymbol,
                isEllipsisAppended: false,
                smallestUnitsOverride,
                formatStyle,
            });
        },
        [cryptoIdToCoinSymbol, CryptoAmountFormatter, formatStyle],
    );
};
