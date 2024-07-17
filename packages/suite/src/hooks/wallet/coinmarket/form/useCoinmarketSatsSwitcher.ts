import { Account } from '@suite-common/wallet-types';
import { amountToSatoshi, formatAmount } from '@suite-common/wallet-utils';
import { useDidUpdate } from '@trezor/react-utils';
import { FORM_CRYPTO_INPUT } from 'src/constants/wallet/coinmarket/form';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { Network } from 'src/types/wallet';

interface UseCoinmarketSatsSwitcherProps {
    account: Account;
    methods: any;
    cryptoInputAmount: string | undefined;
    fiatInputAmount: string | undefined;
    network: Network;
    setIsSubmittingHelper: (value: boolean) => void;
}

/**
 * Hook for switching between crypto and fiat amount in coinmarket Sell and Buy form
 */
export const useCoinmarketSatsSwitcher = ({
    account,
    methods,
    cryptoInputAmount,
    fiatInputAmount,
    network,
    setIsSubmittingHelper,
}: UseCoinmarketSatsSwitcherProps) => {
    const { setValue, getValues } = methods;
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const conversion = shouldSendInSats ? amountToSatoshi : formatAmount;

    const toggleAmountInCrypto = () => {
        const { getValues, setValue } = methods;
        const { amountInCrypto } = getValues();

        if (!amountInCrypto) {
            const amount = conversion(cryptoInputAmount ?? '', network.decimals);
            setValue('cryptoInput', amount);
        } else {
            setValue('fiatInput', fiatInputAmount ?? '');
        }

        setValue('amountInCrypto', !amountInCrypto);
        setIsSubmittingHelper(true); // remove delay of sending request
    };

    useDidUpdate(() => {
        const cryptoInputValue = getValues(FORM_CRYPTO_INPUT);

        if (!cryptoInputValue) {
            return;
        }

        setValue(FORM_CRYPTO_INPUT, conversion(cryptoInputValue, network.decimals), {
            shouldValidate: true,
            shouldDirty: true,
        });
    }, [shouldSendInSats]);

    return {
        toggleAmountInCrypto,
    };
};
