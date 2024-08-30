import { Account } from '@suite-common/wallet-types';
import { amountToSatoshi, formatAmount } from '@suite-common/wallet-utils';
import { useDidUpdate } from '@trezor/react-utils';
import { FORM_CRYPTO_INPUT, FORM_FIAT_INPUT } from 'src/constants/wallet/coinmarket/form';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { NetworkCompatible } from '@suite-common/wallet-config';
import { coinmarketGetRoundedFiatAmount } from 'src/utils/wallet/coinmarket/coinmarketUtils';

interface UseCoinmarketSatsSwitcherProps {
    account: Account;
    methods: any;
    quoteCryptoAmount: string | undefined;
    quoteFiatAmount: string | undefined;
    network: NetworkCompatible | null;
}

/**
 * Hook for switching between crypto and fiat amount in coinmarket Sell and Buy form
 */
export const useCoinmarketSatsSwitcher = ({
    account,
    methods,
    quoteCryptoAmount,
    quoteFiatAmount,
    network,
}: UseCoinmarketSatsSwitcherProps) => {
    const { setValue, getValues } = methods;
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const networkDecimals = network?.decimals ?? 8;

    const toggleAmountInCrypto = () => {
        const { getValues, setValue } = methods;
        const { amountInCrypto } = getValues();

        if (!amountInCrypto) {
            const amount = shouldSendInSats
                ? amountToSatoshi(quoteCryptoAmount ?? '', networkDecimals)
                : quoteCryptoAmount;

            setValue(FORM_CRYPTO_INPUT, amount);
        } else {
            setValue(FORM_FIAT_INPUT, coinmarketGetRoundedFiatAmount(quoteFiatAmount));
        }

        setValue('amountInCrypto', !amountInCrypto);
    };

    useDidUpdate(() => {
        const cryptoInputValue = getValues(FORM_CRYPTO_INPUT);
        const conversion = shouldSendInSats ? amountToSatoshi : formatAmount;

        if (!cryptoInputValue) {
            return;
        }

        setValue(FORM_CRYPTO_INPUT, conversion(cryptoInputValue, networkDecimals), {
            shouldValidate: true,
            shouldDirty: true,
        });
    }, [shouldSendInSats]);

    return {
        toggleAmountInCrypto,
    };
};
