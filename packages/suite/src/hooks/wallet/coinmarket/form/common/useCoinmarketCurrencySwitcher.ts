import { Account } from '@suite-common/wallet-types';
import { amountToSatoshi, formatAmount } from '@suite-common/wallet-utils';
import { useDidUpdate } from '@trezor/react-utils';
import { UseFormReturn } from 'react-hook-form';
import {
    FORM_CRYPTO_INPUT,
    FORM_FIAT_INPUT,
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_FIAT,
    FORM_OUTPUT_MAX,
} from 'src/constants/wallet/coinmarket/form';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    CoinmarketAllFormProps,
    CoinmarketSellExchangeFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import { Network } from 'src/types/wallet';
import { SendContextValues } from 'src/types/wallet/sendForm';
import { coinmarketGetRoundedFiatAmount } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { getNetworkDecimals } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';

interface CoinmarketUseCurrencySwitcherProps<T extends CoinmarketAllFormProps> {
    account: Account;
    methods: UseFormReturn<T>;
    quoteCryptoAmount: string | undefined;
    quoteFiatAmount: string | undefined;
    network: Network | null;
    inputNames: {
        cryptoInput: typeof FORM_CRYPTO_INPUT | typeof FORM_OUTPUT_AMOUNT;
        fiatInput: typeof FORM_FIAT_INPUT | typeof FORM_OUTPUT_FIAT;
    };
    composeRequest?: SendContextValues<CoinmarketSellExchangeFormProps>['composeTransaction'];
}

/**
 * Hook for switching between crypto and fiat amount in coinmarket Sell and Buy form
 */
export const useCoinmarketCurrencySwitcher = <T extends CoinmarketAllFormProps>({
    account,
    methods,
    quoteCryptoAmount,
    quoteFiatAmount,
    network,
    inputNames,
    composeRequest,
}: CoinmarketUseCurrencySwitcherProps<T>) => {
    const { setValue, getValues, watch } =
        methods as unknown as UseFormReturn<CoinmarketAllFormProps>;
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const networkDecimals = getNetworkDecimals(network?.decimals);
    const cryptoInputValue = watch(inputNames.cryptoInput);

    const toggleAmountInCrypto = () => {
        const { amountInCrypto } = getValues();

        if (!amountInCrypto) {
            const amount = shouldSendInSats
                ? amountToSatoshi(quoteCryptoAmount ?? '', networkDecimals)
                : quoteCryptoAmount;

            setValue(inputNames.cryptoInput, amount);
        } else {
            setValue(inputNames.fiatInput, coinmarketGetRoundedFiatAmount(quoteFiatAmount));
        }

        setValue('amountInCrypto', !amountInCrypto);
        setValue(FORM_OUTPUT_MAX, undefined); // turn off computing fees on max balance

        // should be allowed only in sell/exchange
        if (composeRequest) {
            composeRequest(FORM_OUTPUT_AMOUNT);
        }
    };

    useDidUpdate(() => {
        const conversion = shouldSendInSats ? amountToSatoshi : formatAmount;

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
