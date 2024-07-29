import {
    selectAccounts,
    selectDevice,
    selectFiatRatesByFiatRateKey,
} from '@suite-common/wallet-core';
import {
    amountToSatoshi,
    formatAmount,
    fromFiatCurrency,
    getFiatRateKey,
    isEthereumAccountSymbol,
    isZero,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';
import { FiatCurrencyCode } from 'invity-api';
import { useCallback } from 'react';
import { setCoinmarketSellAccount } from 'src/actions/wallet/coinmarketSellActions';
import {
    FORM_CRYPTO_TOKEN,
    FORM_OUTPUT_ADDRESS,
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_CURRENCY,
    FORM_OUTPUT_FIAT,
} from 'src/constants/wallet/coinmarket/form';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { CoinmarketAccountOptionsGroupOptionProps } from 'src/types/coinmarket/coinmarket';
import {
    CoinmarketExchangeFormHelpersProps,
    CoinmarketUseExchangeFormHelpersProps,
} from 'src/types/coinmarket/coinmarketForm';
import { Option } from 'src/types/wallet/coinmarketCommonTypes';
import {
    coinmarketGetSortedAccounts,
    mapTestnetSymbol,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { cryptoToNetworkSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';

/**
 * @return functions and values to handle form inputs and update fee levels
 *
 */
export const useCoinmarketExchangeFormHelpers = ({
    account,
    network,
    methods,
    setAmountLimits,
    changeFeeLevel,
    composeRequest,
}: CoinmarketUseExchangeFormHelpersProps): CoinmarketExchangeFormHelpersProps => {
    const { symbol } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const accounts = useSelector(selectAccounts);
    const device = useSelector(selectDevice);
    const accountsSorted = coinmarketGetSortedAccounts({
        accounts,
        deviceState: device?.state,
    });

    const dispatch = useDispatch();
    const { getValues, setValue, clearErrors } = methods;
    const { outputs } = getValues();
    const tokenAddress = outputs?.[0]?.token;
    const tokenData = account.tokens?.find(t => t.contract === tokenAddress);
    const isBalanceZero = tokenData
        ? isZero(tokenData.balance || '0')
        : isZero(account.formattedBalance);
    const symbolForFiat = mapTestnetSymbol(symbol);

    const currency: Option | undefined = getValues(FORM_OUTPUT_CURRENCY);
    const fiatRateKey = getFiatRateKey(symbolForFiat, currency?.value as FiatCurrencyCode);
    const fiatRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    // watch change in crypto amount and recalculate fees on change
    const onCryptoAmountChange = useCallback(
        (amount: string) => {
            const currency: { value: string; label: string } | undefined =
                getValues(FORM_OUTPUT_CURRENCY);
            if (!fiatRate?.rate || !currency) return;

            const cryptoAmount =
                amount && shouldSendInSats ? formatAmount(amount, network.decimals) : amount;
            const fiatValue = toFiatCurrency(cryptoAmount, fiatRate.rate, 2);

            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            setValue(FORM_OUTPUT_AMOUNT, amount || '', { shouldDirty: true });
            setValue(FORM_OUTPUT_FIAT, fiatValue || '', { shouldValidate: true });
        },
        [shouldSendInSats, fiatRate, getValues, network.decimals, setValue],
    );

    // watch change in fiat amount and recalculate fees on change
    const onFiatAmountChange = useCallback(
        (amount: string, decimals: number) => {
            const currency: { value: string; label: string } | undefined =
                getValues(FORM_OUTPUT_CURRENCY);
            if (!fiatRate?.rate || !currency) return;
            const cryptoValue = fromFiatCurrency(amount, decimals, fiatRate.rate);
            const formattedCryptoValue =
                cryptoValue && shouldSendInSats
                    ? amountToSatoshi(cryptoValue, network.decimals)
                    : cryptoValue || '';

            setValue(FORM_OUTPUT_AMOUNT, formattedCryptoValue, { shouldValidate: true });
        },
        [getValues, fiatRate, shouldSendInSats, network.decimals, setValue],
    );

    const onCryptoCurrencyChange = useCallback(
        (selected: CoinmarketAccountOptionsGroupOptionProps) => {
            const networkSymbol = cryptoToNetworkSymbol(selected.value);
            const account = accountsSorted.find(item => item.descriptor === selected.descriptor);

            setValue(FORM_OUTPUT_ADDRESS, '');
            setValue(FORM_CRYPTO_TOKEN, selected?.contractAddress ?? null);

            if (networkSymbol && isEthereumAccountSymbol(networkSymbol)) {
                // set token address for ERC20 transaction to estimate the fees more precisely
                setValue(FORM_OUTPUT_ADDRESS, selected?.contractAddress ?? '');
            }

            if (networkSymbol === 'sol') {
                setValue(FORM_OUTPUT_ADDRESS, selected?.descriptor ?? '');
            }

            setValue('setMaxOutputId', undefined);
            setValue(FORM_OUTPUT_FIAT, '');
            setValue(FORM_OUTPUT_AMOUNT, '');
            setAmountLimits(undefined);

            if (account) {
                dispatch(setCoinmarketSellAccount(account));
                changeFeeLevel('normal'); // reset fee level
            }
        },
        [accountsSorted, setValue, setAmountLimits, changeFeeLevel, dispatch],
    );

    const onSendCryptoValueChange = (amount: string, decimals: number) => {
        const currency: { value: string; label: string } | undefined =
            getValues(FORM_OUTPUT_CURRENCY);
        if (!fiatRate?.rate || !currency) return;
        const cryptoValue = fromFiatCurrency(amount, decimals, fiatRate.rate);
        const formattedCryptoValue =
            cryptoValue && shouldSendInSats
                ? amountToSatoshi(cryptoValue, network.decimals)
                : cryptoValue || '';

        setValue(FORM_OUTPUT_AMOUNT, formattedCryptoValue, { shouldValidate: true });
    };

    const setRatioAmount = useCallback(
        (divisor: number) => {
            const amount = tokenData
                ? new BigNumber(tokenData.balance || '0')
                      .dividedBy(divisor)
                      .decimalPlaces(tokenData.decimals)
                      .toString()
                : new BigNumber(account.formattedBalance)
                      .dividedBy(divisor)
                      .decimalPlaces(network.decimals)
                      .toString();
            const cryptoInputValue = shouldSendInSats
                ? amountToSatoshi(amount, network.decimals)
                : amount;
            setValue(FORM_OUTPUT_AMOUNT, cryptoInputValue, { shouldDirty: true });

            onCryptoAmountChange(cryptoInputValue);
        },
        [
            account.formattedBalance,
            shouldSendInSats,
            network.decimals,
            onCryptoAmountChange,
            tokenData,
            setValue,
        ],
    );

    const setAllAmount = useCallback(() => {
        setValue('setMaxOutputId', 0, { shouldDirty: true });
        setValue(FORM_OUTPUT_AMOUNT, '', { shouldDirty: true });
        clearErrors([FORM_OUTPUT_AMOUNT, FORM_OUTPUT_FIAT]);
        composeRequest(FORM_OUTPUT_AMOUNT);
    }, [setValue, composeRequest, clearErrors]);

    return {
        isBalanceZero,
        fiatRate,

        onCryptoAmountChange,
        onFiatAmountChange,
        onSendCryptoValueChange,
        onCryptoCurrencyChange,
        setRatioAmount,
        setAllAmount,
    };
};

export default useCoinmarketExchangeFormHelpers;
