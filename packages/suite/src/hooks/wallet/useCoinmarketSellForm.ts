import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { SellFiatTradeQuoteRequest } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';

import {
    fromFiatCurrency,
    getFeeLevels,
    amountToSatoshi,
    formatAmount,
    getFiatRateKey,
} from '@suite-common/wallet-utils';
import { useDidUpdate } from '@trezor/react-utils';
import { isChanged } from '@suite-common/suite-utils';
import { selectDevice, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';

import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import {
    clearQuotes,
    saveQuoteRequest,
    saveQuotes,
} from 'src/actions/wallet/coinmarketSellActions';
import {
    loadInvityData,
    saveComposedTransactionInfo,
} from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import {
    SellFormState,
    UseCoinmarketSellFormProps,
    SellFormContextValues,
    CRYPTO_INPUT,
    FIAT_INPUT,
    OUTPUT_AMOUNT,
    FIAT_CURRENCY_SELECT,
} from 'src/types/wallet/coinmarketSellForm';
import {
    getComposeAddressPlaceholder,
    mapTestnetSymbol,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { getAmountLimits, processQuotes } from 'src/utils/wallet/coinmarket/sellUtils';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import type { AppState } from 'src/types/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { AmountLimits } from 'src/types/wallet/coinmarketCommonTypes';

import { useCoinmarketSellFormDefaultValues } from './useCoinmarketSellFormDefaultValues';
import { useCompose } from './form/useCompose';
import { useFees } from './form/useFees';
import { AddressDisplayOptions, selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';
import { networkToCryptoSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

export const SellFormContext = createContext<SellFormContextValues | null>(null);
SellFormContext.displayName = 'CoinmarketSellContext';

const useSellState = (
    selectedAccount: UseCoinmarketSellFormProps['selectedAccount'],
    fees: AppState['wallet']['fees'],
    currentState: boolean,
    defaultFormValues?: SellFormState,
) => {
    // do not calculate if currentState is already set (prevent re-renders)
    if (selectedAccount.status !== 'loaded' || currentState) return;

    const { account, network } = selectedAccount;
    const coinFees = fees[account.symbol];
    const levels = getFeeLevels(account.networkType, coinFees);
    const feeInfo = { ...coinFees, levels };

    return {
        account,
        network,
        feeInfo,
        formValues: defaultFormValues,
    };
};

export const useCoinmarketSellForm = ({
    selectedAccount,
}: UseCoinmarketSellFormProps): SellFormContextValues => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(loadInvityData());
    }, [dispatch]);

    const accounts = useSelector(state => state.wallet.accounts);
    const device = useSelector(selectDevice);
    const localCurrency = useSelector(selectLocalCurrency);
    const fees = useSelector(state => state.wallet.fees);
    const sellInfo = useSelector(state => state.wallet.coinmarket.sell.sellInfo);
    const quotesRequest = useSelector(state => state.wallet.coinmarket.sell.quotesRequest);
    const addressDisplayType = useSelector(selectAddressDisplayType);

    const { account, network } = selectedAccount;
    const { navigateToSellOffers } = useCoinmarketNavigation(account);
    const { symbol, networkType } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);

    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const symbolForFiat = mapTestnetSymbol(symbol);
    const localCurrencyOption = { value: localCurrency, label: localCurrency.toUpperCase() };

    const [state, setState] = useState<ReturnType<typeof useSellState>>(undefined);

    const { saveDraft, getDraft, removeDraft } = useFormDraft<SellFormState>('coinmarket-sell');
    const draft = getDraft(account.key);
    const isDraft = !!draft;

    const { defaultCountry, defaultCurrency, defaultValues } = useCoinmarketSellFormDefaultValues(
        account.symbol,
        sellInfo,
        state?.formValues?.outputs[0].address,
    );

    // throttle initial state calculation
    const initState = useSellState(selectedAccount, fees, !!state, defaultValues);

    const chunkify = addressDisplayType === AddressDisplayOptions.CHUNKED;

    useEffect(() => {
        const setStateAsync = async (initState: NonNullable<ReturnType<typeof useSellState>>) => {
            const address = await getComposeAddressPlaceholder(
                account,
                network,
                device,
                accounts,
                chunkify,
            );
            if (initState.formValues && address) {
                initState.formValues.outputs[0].address = address;

                setState(initState);
            }
        };

        if (!state && initState) {
            setStateAsync(initState);
        }
    }, [
        state,
        initState,
        account,
        network,
        device,
        accounts,
        chunkify,
        sellInfo?.supportedCryptoCurrencies,
    ]);

    const methods = useForm<SellFormState>({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });

    const { reset, register, setValue, getValues, setError, clearErrors, control, formState } =
        methods;

    const values = useWatch<SellFormState>({ control });

    const currency: { value: string; label: string } | undefined = getValues(FIAT_CURRENCY_SELECT);

    const fiatRateKey = getFiatRateKey(symbolForFiat, currency?.value as FiatCurrencyCode);
    const fiatRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(account.key);

            return;
        }

        if (values.cryptoCurrencySelect && !values.cryptoCurrencySelect?.cryptoSymbol) {
            removeDraft(account.key);
        }
    }, [defaultValues, values, removeDraft, account.key]);

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('options');
        register('outputs');
        register('setMaxOutputId');
    }, [register]);

    // react-hook-form reset, set default values
    useEffect(() => {
        if (!isDraft && defaultValues) {
            reset(defaultValues);
        }
    }, [reset, isDraft, defaultValues]);

    const {
        isLoading: isComposing,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
    } = useCompose({
        ...methods,
        state,
    });

    useDebounce(
        () => {
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0 &&
                !isComposing
            ) {
                saveDraft(selectedAccount.account.key, values as SellFormState);
            }
        },
        200,
        [
            saveDraft,
            selectedAccount.account.key,
            values,
            formState.errors,
            formState.isDirty,
            formState.isValidating,
            isComposing,
        ],
    );

    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);

    const isLoading = !sellInfo?.sellList || !state?.formValues?.outputs[0].address;
    const noProviders =
        sellInfo?.sellList?.providers.length === 0 ||
        !(
            networkToCryptoSymbol(account.symbol) &&
            sellInfo?.supportedCryptoCurrencies.has(networkToCryptoSymbol(account.symbol)!)
        );

    // sub-hook, FeeLevels handler
    const { changeFeeLevel, selectedFee } = useFees({
        defaultValue: 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        ...methods,
    });

    // watch change in crypto amount and recalculate fees on change
    const onCryptoAmountChange = useCallback(
        (amount: string) => {
            setValue(FIAT_INPUT, '', { shouldDirty: true });
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            clearErrors(FIAT_INPUT);
            setValue(OUTPUT_AMOUNT, amount || '', { shouldDirty: true });
            composeRequest(CRYPTO_INPUT);
        },
        [clearErrors, composeRequest, setValue],
    );

    // watch change in fiat amount and recalculate fees on change
    const onFiatAmountChange = useCallback(
        (amount: string) => {
            setValue(CRYPTO_INPUT, '', { shouldDirty: true });
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            clearErrors(CRYPTO_INPUT);
            const currency: typeof defaultCurrency | undefined = getValues(FIAT_CURRENCY_SELECT);
            if (!fiatRate?.rate || !currency) return;

            const cryptoValue = fromFiatCurrency(
                amount,
                currency.value.toLowerCase(),
                fiatRate,
                network.decimals,
                false,
            );
            const cryptoInputValue =
                cryptoValue && shouldSendInSats
                    ? amountToSatoshi(cryptoValue, network.decimals)
                    : cryptoValue;
            setValue(OUTPUT_AMOUNT, cryptoInputValue || '', {
                shouldDirty: true,
                shouldValidate: false,
            });
            composeRequest(FIAT_INPUT);
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

    const { translationString } = useTranslation();

    useEffect(() => {
        if (!composedLevels) return;
        const values = getValues();
        const { setMaxOutputId } = values;
        const selectedFeeLevel = selectedFee || 'normal';
        const composed = composedLevels[selectedFeeLevel];
        if (!composed) return;

        if (composed.type === 'final') {
            if (typeof setMaxOutputId === 'number' && composed.max) {
                setValue(CRYPTO_INPUT, composed.max, { shouldValidate: true, shouldDirty: true });
                clearErrors(CRYPTO_INPUT);
            }
            dispatch(saveComposedTransactionInfo({ selectedFee: selectedFeeLevel, composed }));
            setValue('estimatedFeeLimit', composed.estimatedFeeLimit, { shouldDirty: true });
        }
    }, [
        clearErrors,
        composedLevels,
        dispatch,
        getValues,
        setError,
        setValue,
        selectedFee,
        translationString,
    ]);

    useDidUpdate(() => {
        const cryptoInputValue = getValues(CRYPTO_INPUT);
        if (!cryptoInputValue) {
            return;
        }
        const conversion = shouldSendInSats ? amountToSatoshi : formatAmount;
        setValue(CRYPTO_INPUT, conversion(cryptoInputValue, network.decimals), {
            shouldValidate: true,
            shouldDirty: true,
        });
    }, [shouldSendInSats]);

    const onSubmit = async () => {
        const formValues = getValues();
        const fiatStringAmount = formValues.fiatInput;
        const cryptoStringAmount =
            formValues.cryptoInput && shouldSendInSats
                ? formatAmount(formValues.cryptoInput, network.decimals)
                : formValues.cryptoInput;
        const amountInCrypto = !fiatStringAmount;
        const request: SellFiatTradeQuoteRequest = {
            amountInCrypto,
            cryptoCurrency: formValues.cryptoCurrencySelect.cryptoSymbol,
            fiatCurrency: formValues.fiatCurrencySelect.value.toUpperCase(),
            country: formValues.countrySelect.value,
            cryptoStringAmount,
            fiatStringAmount,
            flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
        };
        dispatch(saveQuoteRequest(request));
        const allQuotes = await invityAPI.getSellQuotes(request);
        if (Array.isArray(allQuotes)) {
            const limits = getAmountLimits(request, allQuotes);
            if (limits) {
                setAmountLimits(limits);
            } else {
                const [quotes, alternativeQuotes] = processQuotes(allQuotes);
                dispatch(saveQuotes(quotes, alternativeQuotes));
                navigateToSellOffers();
            }
        } else {
            dispatch(clearQuotes());
            navigateToSellOffers();
        }
    };

    const handleClearFormButtonClick = useCallback(() => {
        removeDraft(account.key);
        reset(defaultValues);
        composeRequest(CRYPTO_INPUT);
    }, [account.key, removeDraft, reset, defaultValues, composeRequest]);

    return {
        ...methods,
        account,
        defaultCountry,
        defaultCurrency,
        onSubmit,
        register,
        sellInfo,
        changeFeeLevel,
        quotesRequest,
        composedLevels,
        localCurrencyOption,
        feeInfo,
        composeRequest,
        fiatRate,
        isComposing,
        amountLimits,
        setAmountLimits,
        isLoading,
        noProviders,
        network,
        onCryptoAmountChange,
        onFiatAmountChange,
        handleClearFormButtonClick,
        formState,
        isDraft,
    };
};

export const useCoinmarketSellFormContext = () => {
    const context = useContext(SellFormContext);
    if (context === null) throw Error('SellFormContext used without Context');

    return context;
};
