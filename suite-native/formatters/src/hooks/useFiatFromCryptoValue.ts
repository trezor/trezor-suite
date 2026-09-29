import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
} from '@suite-common/wallet-core';
import { type BaseCurrencyAmount, type TokenAddress } from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    getFiatRateKey,
    isTestnet,
    subunitsToUnits,
    toBaseCurrencyDisplayAmount,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { convertTokenValueToDecimal } from '../utils';

type useFiatFromCryptoValueParams = {
    cryptoValue: string | null;
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
    tokenDecimals?: number;
    historicRate?: number;
    useHistoricRate?: boolean;
    isBalance?: boolean;
};

export const useFiatFromCryptoValue = ({
    cryptoValue,
    symbol,
    tokenAddress,
    historicRate,
    useHistoricRate,
    isBalance = false,
    tokenDecimals = 0,
}: useFiatFromCryptoValueParams): BaseCurrencyAmount | null =>
    // The whole conversion runs inside one selector returning a display-rounded, interned amount,
    // so rate and balance churn below the rendered precision doesn't rerender the consumer.
    useSelector((state: FiatRatesRootState & WalletSettingsRootState) => {
        if (!cryptoValue || isTestnet(symbol)) return null;

        const fiatCurrencyCode = selectBaseCurrency(state);
        const fiatRateKey = getFiatRateKey(symbol, fiatCurrencyCode, tokenAddress);
        const currentRate = selectFiatRatesByFiatRateKey(state, fiatRateKey);
        const rate = useHistoricRate ? historicRate : currentRate?.rate;

        const toDisplayAmount = (fiatAmount: BaseCurrencyAmount | null) =>
            fiatAmount === null
                ? null
                : toBaseCurrencyDisplayAmount({
                      value: fiatAmount,
                      baseCurrencyCode: fiatCurrencyCode,
                  });

        if (tokenAddress) {
            const decimalValue = convertTokenValueToDecimal(cryptoValue, tokenDecimals);

            // Zero balance always yields zero fiat regardless of rate — rate: 1 is a dummy (0 × n = 0).
            if (new BigNumber(decimalValue).isZero()) {
                return toDisplayAmount(toFiatCurrency({ amount: '0', rate: 1 }));
            }
            if (!rate || currentRate?.error) return null;

            return toDisplayAmount(toFiatCurrency({ amount: decimalValue, rate }));
        }

        if (!rate || currentRate?.error) return null;

        // A balance is already in network units; other values come in sats and must be converted.
        const networkAmount = isBalance
            ? cryptoValue
            : subunitsToUnits({ value: asAmountSubunit(new BigNumber(cryptoValue)), symbol });

        return toDisplayAmount(toFiatCurrency({ amount: networkAmount, rate }));
    });
