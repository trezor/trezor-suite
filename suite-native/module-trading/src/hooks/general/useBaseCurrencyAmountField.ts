import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectIsAmountInSats,
    selectIsBaseCurrencyInSats,
} from '@suite-common/wallet-core';

import {
    getBaseCurrencyAmountFromCrypto,
    getCryptoAmountFromBaseCurrency,
} from '../../utils/general/baseCurrencyAmountUtils';

export type UseBaseCurrencyAmountFieldParams = {
    symbol: NetworkSymbol | undefined;
    rate: number | undefined;
    decimals: number | undefined;
    cryptoAmount: string | undefined;
    typedBaseCurrencyAmount: string | undefined;
    setCryptoAmount: (cryptoAmount: string | undefined) => void;
    setTypedBaseCurrencyAmount: (baseCurrencyAmount: string | undefined) => void;
};

/**
 * Base currency counterpart of a crypto amount form field.
 * The displayed amount is the typed one while it still converts to the crypto amount,
 * otherwise it is derived from the crypto amount.
 */
export const useBaseCurrencyAmountField = ({
    symbol,
    rate,
    decimals,
    cryptoAmount,
    typedBaseCurrencyAmount,
    setCryptoAmount,
    setTypedBaseCurrencyAmount,
}: UseBaseCurrencyAmountFieldParams) => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);

    const setBaseCurrencyAmount = (baseCurrencyAmount: string | undefined) => {
        if (!rate || decimals === undefined) {
            return;
        }

        setCryptoAmount(
            getCryptoAmountFromBaseCurrency({
                baseCurrencyAmount,
                rate,
                decimals,
                isAmountInSats,
                isBaseCurrencyInSats,
            }),
        );
        setTypedBaseCurrencyAmount(baseCurrencyAmount);
    };

    if (!symbol || !rate || decimals === undefined) {
        return {
            baseCurrencyAmount: undefined,
            isConversionAvailable: false,
            setBaseCurrencyAmount,
        };
    }

    const isTypedAmountMatchingCryptoAmount =
        typedBaseCurrencyAmount !== undefined &&
        getCryptoAmountFromBaseCurrency({
            baseCurrencyAmount: typedBaseCurrencyAmount,
            rate,
            decimals,
            isAmountInSats,
            isBaseCurrencyInSats,
        }) === cryptoAmount;

    const baseCurrencyAmount = isTypedAmountMatchingCryptoAmount
        ? typedBaseCurrencyAmount
        : getBaseCurrencyAmountFromCrypto({
              cryptoAmount,
              rate,
              symbol,
              baseCurrency,
              isAmountInSats,
              isBaseCurrencyInSats,
          });

    return { baseCurrencyAmount, isConversionAvailable: true, setBaseCurrencyAmount };
};
