import { useSelector } from 'react-redux';

import { NetworkSymbol, NetworkSymbolExtended, getNetwork } from '@suite-common/wallet-config';
import { selectAreSatsAmountUnit } from '@suite-common/wallet-core';
import { satoshiAmountToBtc } from '@suite-common/wallet-utils';

export const useConvertFormValueToBaseUnit = () => {
    const areSatsAmountUnit = useSelector(selectAreSatsAmountUnit);

    const getIsAmountInSats = (symbol: NetworkSymbolExtended) => {
        // this is copy of selectIsAmountInSats logic
        const network = getNetwork(symbol as NetworkSymbol);
        const isAmountUnitSupported = !!network && network.features.includes('amount-unit');

        return isAmountUnitSupported && areSatsAmountUnit;
    };

    return {
        convertStrToBaseUnit: (amount: string | undefined, symbol: NetworkSymbolExtended) => {
            if (amount === undefined) {
                return undefined;
            }

            return getIsAmountInSats(symbol) ? satoshiAmountToBtc(amount) : amount;
        },

        convertNumberToBaseUnit: (amount: number | undefined, symbol: NetworkSymbolExtended) => {
            if (amount === undefined) {
                return undefined;
            }

            if (getIsAmountInSats(symbol)) {
                return parseFloat(satoshiAmountToBtc(amount.toString()));
            }

            return amount;
        },
    };
};
