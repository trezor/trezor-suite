import { useMemo } from 'react';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { buildFiatOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { Account } from 'src/types/wallet';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { useSelector } from 'src/hooks/suite';
import {
    CoinmarketExchangeFormDefaultValuesProps,
    RateType,
} from 'src/types/coinmarket/coinmarketForm';
import { FormState, Output } from '@suite-common/wallet-types';
import { useCoinmarketBuildAccountGroups } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellFormDefaultValues';

export const useCoinmarketExchangeFormDefaultValues = (
    account: Account,
    defaultAddress?: string,
): CoinmarketExchangeFormDefaultValuesProps => {
    const localCurrency = useSelector(selectLocalCurrency);
    const defaultCurrency = useMemo(() => buildFiatOption(localCurrency), [localCurrency]);
    const cryptoGroups = useCoinmarketBuildAccountGroups('exchange');
    const cryptoOptions = cryptoGroups.flatMap(group => group.options);
    const defaultSendCryptoSelect = useMemo(
        () => cryptoOptions.find(option => option.descriptor === account.descriptor),
        [account.descriptor, cryptoOptions],
    );

    const defaultPayment: Output = useMemo(
        () => ({
            ...DEFAULT_PAYMENT,
            address: defaultAddress ?? '',
            currency: defaultCurrency,
        }),
        [defaultAddress, defaultCurrency],
    );
    const defaultFormState: FormState = useMemo(
        () => ({
            ...DEFAULT_VALUES,
            selectedUtxos: [],
            options: ['broadcast'],
            outputs: [defaultPayment],
        }),
        [defaultPayment],
    );
    const defaultValues = useMemo(
        () => ({
            ...defaultFormState,
            amountInCrypto: true,
            sendCryptoSelect: defaultSendCryptoSelect,
            receiveCryptoSelect: null,
            rateType: 'fixed' as RateType,
        }),
        [defaultFormState, defaultSendCryptoSelect],
    );

    return { defaultValues, defaultCurrency };
};
