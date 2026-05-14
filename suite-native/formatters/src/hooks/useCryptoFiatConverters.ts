import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectIsAmountInSats,
    selectIsBaseCurrencyInSats,
} from '@suite-common/wallet-core';
import {
    type BaseCurrencyAmount,
    type TokenAddress,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    asAmountUnit,
    fromBaseCurrencyToCryptoUnit,
    getFiatRateKey,
    isTestnet,
    subunitsToUnits,
    toFiatCurrency,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { type BigNumber } from '@trezor/utils';

type UseConvertFiatToCryptoParams = {
    symbol: NetworkSymbol | null;
    tokenContract?: TokenAddress;
    tokenDecimals?: number;
    historicRate?: number;
    useHistoricRate?: boolean;
    isBalance?: boolean;
};

export const useCryptoFiatConverters = ({
    symbol,
    tokenContract,
    historicRate,
    useHistoricRate,
}: UseConvertFiatToCryptoParams) => {
    const symbolHelper = symbol ?? 'btc'; // handles passing the value to selectors
    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbolHelper),
    );

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const fiatRateKey = getFiatRateKey(symbolHelper, baseCurrencyCode, tokenContract);
    const currentRate = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    const rate = useHistoricRate ? historicRate : currentRate?.rate;
    const isTestnetCoin = isTestnet(symbolHelper);

    if (!rate || currentRate?.error || isTestnetCoin || !symbol) return null;

    // Todo: this logic is duplicated in `parseBaseCurrencyToFormattedCrypto`/`parseCryptoToFormattedBaseCurrency` shall be deduped

    return {
        convertFiatToCrypto: (baseCurrencyAmount: BaseCurrencyAmount) => {
            // 1. If the Base Currency is in sats (BTC only), we first unify it to whole Unit
            const baseCurrencyUnitAmount = isBaseCurrencyInSats
                ? asBaseCurrencyAmount(
                      subunitsToUnits({
                          value: asAmountSubunit(baseCurrencyAmount),
                          symbol: 'btc',
                      }),
                  )
                : baseCurrencyAmount;

            const cryptoUnitAmount = fromBaseCurrencyToCryptoUnit({
                fiatAmount: baseCurrencyUnitAmount,
                rate,
            });

            if (cryptoUnitAmount === null) {
                return null;
            }

            // 2. If the Crypto Amount is in Sats, we now need to convert it back
            return isAmountInSats
                ? unitsToSubunits({ value: cryptoUnitAmount, symbol })
                : cryptoUnitAmount;
        },
        convertCryptoToFiat: (amount: BigNumber) => {
            // 1. Crypto Amount may be in Sats or not
            const amountUnit = isAmountInSats
                ? subunitsToUnits({ value: asAmountSubunit(amount), symbol })
                : asAmountUnit(amount);

            const baseCurrency = toFiatCurrency({ amount: amountUnit, rate });

            if (baseCurrency === null) {
                return null;
            }

            // 2. If BaseUnits are Sats (BTC only), we have to convert it to sats
            return isBaseCurrencyInSats
                ? asBaseCurrencyAmount(
                      unitsToSubunits({ value: asAmountUnit(baseCurrency), symbol: 'btc' }),
                  )
                : baseCurrency;
        },
    };
};
