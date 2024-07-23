import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import {
    amountToSatoshi,
    fromFiatCurrency,
    getFiatRateKey,
    isZero,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';
import { FiatCurrencyCode } from 'invity-api';
import { useCallback } from 'react';
import {
    FORM_CRYPTO_INPUT,
    FORM_FIAT_CURRENCY_SELECT,
    FORM_FIAT_INPUT,
    FORM_OUTPUT_AMOUNT,
} from 'src/constants/wallet/coinmarket/form';
import { useSelector } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    CoinmarketFormHelpersProps,
    CoinmarketUseSellFormHelpersProps,
} from 'src/types/coinmarket/coinmarketForm';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';

/**
 * @return functions and values to handle form inputs and update fee levels
 */
const useCoinmarketSellFormHelpers = ({
    account,
    network,
    composeRequest,
    methods,
    defaultCurrency,
}: CoinmarketUseSellFormHelpersProps): CoinmarketFormHelpersProps => {
    const { symbol } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);

    const { getValues, setValue, clearErrors } = methods;
    const { outputs } = getValues();
    const tokenAddress = outputs?.[0]?.token;
    const tokenData = account.tokens?.find(t => t.contract === tokenAddress);
    const isBalanceZero = tokenData
        ? isZero(tokenData.balance || '0')
        : isZero(account.formattedBalance);
    const symbolForFiat = mapTestnetSymbol(symbol);

    const currency: { value: string; label: string } | undefined =
        getValues(FORM_FIAT_CURRENCY_SELECT);
    const fiatRateKey = getFiatRateKey(symbolForFiat, currency?.value as FiatCurrencyCode);
    const fiatRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    // watch change in crypto amount and recalculate fees on change
    const onCryptoAmountChange = useCallback(
        (amount: string) => {
            clearErrors(FORM_FIAT_INPUT);

            // setValue(FORM_FIAT_INPUT, '', { shouldDirty: true });
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            setValue(FORM_OUTPUT_AMOUNT, amount || '', { shouldDirty: true });

            composeRequest(FORM_CRYPTO_INPUT);
        },
        [clearErrors, composeRequest, setValue],
    );

    // watch change in fiat amount and recalculate fees on change
    const onFiatAmountChange = useCallback(
        (amount: string) => {
            clearErrors(FORM_CRYPTO_INPUT);

            // setValue(FORM_CRYPTO_INPUT, '', { shouldDirty: true });
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            const currency: typeof defaultCurrency | undefined =
                getValues(FORM_FIAT_CURRENCY_SELECT);

            if (!fiatRate?.rate || !currency) return;

            const cryptoValue = fromFiatCurrency(amount, network.decimals, fiatRate.rate);
            const cryptoInputValue =
                cryptoValue && shouldSendInSats
                    ? amountToSatoshi(cryptoValue, network.decimals)
                    : cryptoValue;

            setValue(FORM_OUTPUT_AMOUNT, cryptoInputValue || '', {
                shouldDirty: true,
                shouldValidate: false,
            });

            composeRequest(FORM_FIAT_INPUT);
        },
        [
            setValue,
            clearErrors,
            getValues,
            fiatRate,
            shouldSendInSats,
            network.decimals,
            composeRequest,
        ],
    );

    /*
    const onCryptoCurrencyChange = useCallback(
        (selected: CoinmarketCryptoListProps) => {
            setValue('setMaxOutputId', undefined);
            setAmountLimits(undefined);
            setValue(FORM_CRYPTO_INPUT, '');
            setValue(FORM_FIAT_INPUT, '');
            const token = selected.value;
            const invitySymbol = invityApiSymbolToSymbol(token).toLowerCase();
            const tokenData = account.tokens?.find(
                t => t.symbol === invitySymbol && t.contract === selected.token?.contract,
            );
            const ethereumTypeNetworkSymbols = getEthereumTypeNetworkSymbols();

            if (ethereumTypeNetworkSymbols.includes(token)) {
                setValue(FORM_CRYPTO_TOKEN, null);
                setValue('outputs.0.address', account.descriptor);
            } else if (symbol === 'sol') {
                setValue(FORM_CRYPTO_TOKEN, tokenData?.contract ?? null);
                setValue('outputs.0.address', account.descriptor);
            } else {
                // set the address of the token to the output
                setValue(FORM_CRYPTO_TOKEN, tokenData?.contract ?? null);
                // set token address for ERC20 transaction to estimate the fees more precisely
                setValue('outputs.0.address', tokenData?.contract ?? '');
            }
            composeRequest();
        },
        [account.descriptor, account.tokens, composeRequest, setValue, symbol],
    );
    */

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
            clearErrors([FORM_CRYPTO_INPUT]);
            onCryptoAmountChange(cryptoInputValue);
        },
        [
            account.formattedBalance,
            shouldSendInSats,
            clearErrors,
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
        clearErrors([FORM_FIAT_INPUT, FORM_CRYPTO_INPUT]);
        composeRequest(FORM_CRYPTO_INPUT);
    }, [clearErrors, composeRequest, setValue]);

    return {
        isBalanceZero,
        fiatRate,

        onCryptoAmountChange,
        onFiatAmountChange,
        setRatioAmount,
        setAllAmount,
    };
};

export default useCoinmarketSellFormHelpers;
