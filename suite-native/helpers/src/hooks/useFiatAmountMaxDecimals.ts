import { useSelector } from 'react-redux';

import { selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';

export const useFiatAmountMaxDecimals = (decimals: number) => {
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);

    return isBaseCurrencyInSats ? 0 : decimals;
};
