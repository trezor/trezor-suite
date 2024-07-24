import { getEthereumTypeNetworkSymbols } from '@suite-common/wallet-config';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { amountToSatoshi, getFiatRateKey, isZero } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';
import { FiatCurrencyCode } from 'invity-api';
import { useCallback } from 'react';
import {
    FORM_CRYPTO_INPUT,
    FORM_CRYPTO_TOKEN,
    FORM_FIAT_CURRENCY_SELECT,
    FORM_FIAT_INPUT,
    FORM_OUTPUT_ADDRESS,
    FORM_OUTPUT_AMOUNT,
} from 'src/constants/wallet/coinmarket/form';
import { useSelector } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { CoinmarketAccountOptionsGroupOptionProps } from 'src/types/coinmarket/coinmarket';
import {
    CoinmarketFormHelpersProps,
    CoinmarketUseSellFormHelpersProps,
} from 'src/types/coinmarket/coinmarketForm';
import { Option } from 'src/types/wallet/coinmarketCommonTypes';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { cryptoToNetworkSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';

/**
 * @return functions and values to handle form inputs and update fee levels
 */
const useCoinmarketSellFormHelpers = ({
    account,
    network,
    methods,
    setAmountLimits,
    composeRequest,
}: CoinmarketUseSellFormHelpersProps): CoinmarketFormHelpersProps => {
    const { symbol } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);

    const { getValues, setValue } = methods;
    const { outputs } = getValues();
    const tokenAddress = outputs?.[0]?.token;
    const tokenData = account.tokens?.find(t => t.contract === tokenAddress);
    const isBalanceZero = tokenData
        ? isZero(tokenData.balance || '0')
        : isZero(account.formattedBalance);
    const symbolForFiat = mapTestnetSymbol(symbol);

    const currency: Option | undefined = getValues(FORM_FIAT_CURRENCY_SELECT);
    const fiatRateKey = getFiatRateKey(symbolForFiat, currency?.value as FiatCurrencyCode);
    const fiatRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    // watch change in crypto amount and recalculate fees on change
    const onCryptoAmountChange = useCallback(
        (amount: string) => {
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            setValue(FORM_OUTPUT_AMOUNT, amount || '', { shouldDirty: true });
        },
        [setValue],
    );

    // watch change in fiat amount and recalculate fees on change
    const onFiatAmountChange = useCallback(
        (cryptoInput: string) => {
            const cryptoInputValue =
                cryptoInput && shouldSendInSats
                    ? amountToSatoshi(cryptoInput, network.decimals)
                    : cryptoInput;
            setValue(FORM_OUTPUT_AMOUNT, cryptoInputValue || '', {
                shouldDirty: true,
                shouldValidate: false,
            });
        },
        [setValue, shouldSendInSats, network.decimals],
    );

    const onCryptoCurrencyChange = useCallback(
        (selected: CoinmarketAccountOptionsGroupOptionProps) => {
            const token = cryptoToNetworkSymbol(selected.value);
            const ethereumTypeNetworkSymbols = getEthereumTypeNetworkSymbols();

            if (!token) return;

            if (ethereumTypeNetworkSymbols.includes(token)) {
                setValue(FORM_CRYPTO_TOKEN, null);
                setValue(FORM_OUTPUT_ADDRESS, selected.descriptor);
            } else if (symbol === 'sol') {
                setValue(FORM_CRYPTO_TOKEN, selected?.contractAddress ?? null);
                setValue(FORM_OUTPUT_ADDRESS, selected?.descriptor ?? '');
            } else {
                // set the address of the token to the output
                setValue(FORM_CRYPTO_TOKEN, selected?.contractAddress ?? null);
                // set token address for ERC20 transaction to estimate the fees more precisely
                setValue(FORM_OUTPUT_ADDRESS, selected?.contractAddress ?? '');
            }

            setValue('setMaxOutputId', undefined);
            setValue(FORM_CRYPTO_INPUT, '');
            setValue(FORM_FIAT_INPUT, '');
            setAmountLimits(undefined);

            composeRequest();
        },
        [setValue, setAmountLimits, symbol, composeRequest],
    );

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
            setValue(FORM_CRYPTO_INPUT, cryptoInputValue, { shouldDirty: true });
            // clearErrors(FORM_CRYPTO_INPUT);
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
        setValue(FORM_FIAT_INPUT, '', { shouldDirty: true });
        setValue(FORM_OUTPUT_AMOUNT, '', { shouldDirty: true });
    }, [setValue]);

    return {
        isBalanceZero,
        fiatRate,

        onCryptoAmountChange,
        onFiatAmountChange,
        onCryptoCurrencyChange,
        setRatioAmount,
        setAllAmount,
    };
};

export default useCoinmarketSellFormHelpers;
