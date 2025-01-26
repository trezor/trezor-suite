import { UseFormReturn, useWatch } from 'react-hook-form';

import { Network } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { amountToSmallestUnit, formatAmount } from '@suite-common/wallet-utils';
import { useDidUpdate } from '@trezor/react-utils';

import {
    FORM_CRYPTO_INPUT,
    FORM_FIAT_INPUT,
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_FIAT,
    FORM_SEND_CRYPTO_CURRENCY_SELECT,
} from 'src/constants/wallet/trading/form';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { TradingAllFormProps, TradingSellExchangeFormProps } from 'src/types/trading/tradingForm';
import { SendContextValues } from 'src/types/wallet/sendForm';
import {
    tradingGetRoundedFiatAmount,
    getTradingNetworkDecimals,
} from 'src/utils/wallet/trading/tradingUtils';

interface TradingUseCurrencySwitcherProps<T extends TradingAllFormProps> {
    account: Account;
    methods: UseFormReturn<T>;
    quoteCryptoAmount: string | undefined;
    quoteFiatAmount: string | undefined;
    network: Network | null;
    inputNames: {
        cryptoInput: typeof FORM_CRYPTO_INPUT | typeof FORM_OUTPUT_AMOUNT;
        fiatInput: typeof FORM_FIAT_INPUT | typeof FORM_OUTPUT_FIAT;
    };
    composeRequest?: SendContextValues<TradingSellExchangeFormProps>['composeTransaction'];
}

/**
 * Hook for switching between crypto and fiat amount in trading Sell and Buy form
 */
export const useTradingCurrencySwitcher = <T extends TradingAllFormProps>({
    account,
    methods,
    quoteCryptoAmount,
    quoteFiatAmount,
    network,
    inputNames,
    composeRequest,
}: TradingUseCurrencySwitcherProps<T>) => {
    const { setValue, getValues, control } =
        methods as unknown as UseFormReturn<TradingAllFormProps>;
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const cryptoInputValue = useWatch({ control, name: inputNames.cryptoInput });
    const sendCryptoSelect = getValues(FORM_SEND_CRYPTO_CURRENCY_SELECT);
    const networkDecimals = getTradingNetworkDecimals({
        sendCryptoSelect,
        network,
    });

    const toggleAmountInCrypto = () => {
        const { amountInCrypto } = getValues();

        if (!amountInCrypto) {
            const amount = shouldSendInSats
                ? amountToSmallestUnit(quoteCryptoAmount ?? '', networkDecimals)
                : quoteCryptoAmount;

            setValue(inputNames.cryptoInput, amount === '-1' ? '' : amount);
        } else {
            setValue(inputNames.fiatInput, tradingGetRoundedFiatAmount(quoteFiatAmount));
        }

        setValue('amountInCrypto', !amountInCrypto);

        // should be allowed only in sell/exchange
        if (composeRequest) {
            composeRequest(FORM_OUTPUT_AMOUNT);
        }
    };

    useDidUpdate(() => {
        const conversion = shouldSendInSats ? amountToSmallestUnit : formatAmount;

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
