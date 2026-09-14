import { useServices } from '@suite-common/dependency-injection';
import { useCallback } from 'react';

import type { CryptoId } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import { selectNetworkConfigDeps } from '@suite-common/networks';
import { type NetworkSymbol, getNetworkDecimals } from '@suite-common/wallet-config';

import { useTradingUtils } from './useTradingUtils';

const TOKEN_DECIMALS_LENGTH = 16;

export const useFormatCryptoValue = () => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

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
            const networkDecimals = coinSymbol
                ? getNetworkDecimals(networkConfigDeps, coinSymbol)
                : undefined;

            return CryptoAmountFormatter.format(value, {
                maxDisplayedDecimals: networkDecimals ?? TOKEN_DECIMALS_LENGTH,
                isBalance: true,
                symbol: coinSymbol as NetworkSymbol,
                isEllipsisAppended: false,
                smallestUnitsOverride,
            });
        },
        [networkConfigDeps, cryptoIdToCoinSymbol, CryptoAmountFormatter],
    );
};
