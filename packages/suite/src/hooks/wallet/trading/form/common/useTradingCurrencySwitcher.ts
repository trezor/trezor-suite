import { type UseFormReturn, useWatch } from 'react-hook-form';

import {
    type TRADING_FORM_CRYPTO_INPUT,
    type TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_CURRENCY,
    type TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
} from '@suite-common/trading';
import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    fromBaseCurrencyToCryptoUnit,
    getFiatRateKey,
} from '@suite-common/wallet-utils';
import { useDidUpdate } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    type TradingAllFormProps,
    type TradingSellExchangeFormProps,
} from 'src/types/trading/tradingForm';
import { type SendContextValues } from 'src/types/wallet/sendForm';
import { tradingGetRoundedFiatAmount } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingAssetDecimals } from './useTradingAssetDecimals';

const DEFAULT_FIAT_RATE_FALLBACK = 'usd';

interface TradingUseCurrencySwitcherProps<T extends TradingAllFormProps> {
    account: Account;
    methods: UseFormReturn<T>;
    inputNames: {
        cryptoInput: typeof TRADING_FORM_CRYPTO_INPUT | typeof TRADING_FORM_OUTPUT_AMOUNT;
        fiatInput: typeof TRADING_FORM_FIAT_INPUT | typeof TRADING_FORM_OUTPUT_FIAT;
    };
    composeRequest?: SendContextValues<TradingSellExchangeFormProps>['composeTransaction'];
}

/**
 * Hook for switching between crypto and fiat amount in trading Sell and Buy form
 */
export const useTradingCurrencySwitcher = <T extends TradingAllFormProps>({
    account,
    methods,
    inputNames,
    composeRequest,
}: TradingUseCurrencySwitcherProps<T>) => {
    const { setValue, getValues, control } =
        methods as unknown as UseFormReturn<TradingAllFormProps>;
    const rates = useSelector(selectCurrentFiatRates);
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const cryptoInputValue = useWatch({ control, name: inputNames.cryptoInput });
    const fiatInputValue = useWatch({ control, name: inputNames.fiatInput });
    const sendCryptoSelect = getValues(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT);
    const currencySelect = getValues(TRADING_FORM_OUTPUT_CURRENCY);
    const { getAssetDecimals } = useTradingAssetDecimals();
    const networkDecimals = getAssetDecimals({
        accountKey: sendCryptoSelect?.accountKey,
        cryptoId: sendCryptoSelect?.id,
    });

    const fiatRateKey = getFiatRateKey(
        account.symbol,
        currencySelect?.value ? currencySelect.value : DEFAULT_FIAT_RATE_FALLBACK,
    );
    const rate = rates && rates[fiatRateKey] ? rates[fiatRateKey].rate : undefined;
    const { fiatAmount } = useFiatFromCryptoValue({
        amount: cryptoInputValue ?? '',
        symbol: account.symbol,
    });

    const cryptoAmount = fiatInputValue
        ? fromBaseCurrencyToCryptoUnit({
              fiatAmount: fiatInputValue,
              rate,
          })
        : undefined;

    const toggleAmountInCrypto = () => {
        const { amountInCrypto } = getValues();

        if (!amountInCrypto) {
            if (cryptoAmount) {
                setValue(inputNames.cryptoInput, cryptoAmount.toFixed(networkDecimals));
            }
        } else {
            if (fiatAmount) {
                setValue(inputNames.fiatInput, tradingGetRoundedFiatAmount(fiatAmount.toString()));
            }
        }

        setValue('amountInCrypto', !amountInCrypto);

        // should be allowed only in sell/exchange
        if (composeRequest) {
            composeRequest(TRADING_FORM_OUTPUT_AMOUNT);
        }
    };

    useDidUpdate(() => {
        const conversion = shouldSendInSats
            ? convertAmountUnitsToSubunits
            : convertAmountSubunitsToUnits;

        if (!cryptoInputValue) {
            return;
        }

        setValue(inputNames.cryptoInput, conversion(cryptoInputValue, networkDecimals), {
            shouldValidate: true,
            shouldDirty: true,
        });
    }, [shouldSendInSats]);

    return {
        toggleAmountInCrypto,
    };
};
