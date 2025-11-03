import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { NetworkSymbol, NetworkSymbolExtended, getNetwork } from '@suite-common/wallet-config';
import { selectAreSatsAmountUnit } from '@suite-common/wallet-core';
import { satoshiAmountToBtc } from '@suite-common/wallet-utils';

export const useConvertFormValueToBaseUnit = () => {
    const areSatsAmountUnit = useSelector(selectAreSatsAmountUnit);

    const getIsAmountInSats = useCallback(
        (symbol: NetworkSymbolExtended) => {
            // this is copy of selectIsAmountInSats logic
            const network = getNetwork(symbol as NetworkSymbol);
            const isAmountUnitSupported = !!network && network.features.includes('amount-unit');

            return isAmountUnitSupported && areSatsAmountUnit;
        },
        [areSatsAmountUnit],
    );

    const convertStrToBaseUnit = useCallback(
        (amount: string | undefined, symbol: NetworkSymbolExtended) =>
            amount !== undefined && getIsAmountInSats(symbol) ? satoshiAmountToBtc(amount) : amount,
        [getIsAmountInSats],
    );

    const convertNumberToBaseUnit = useCallback(
        (amount: number | undefined, symbol: NetworkSymbolExtended) =>
            amount !== undefined && getIsAmountInSats(symbol)
                ? parseFloat(satoshiAmountToBtc(amount.toString()))
                : amount,
        [getIsAmountInSats],
    );

    return {
        convertStrToBaseUnit,
        convertNumberToBaseUnit,
    };
};
