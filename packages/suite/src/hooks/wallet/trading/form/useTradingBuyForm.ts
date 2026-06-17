import { useCallback, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { BuyTrade } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import {
    TRADING_DEFAULT_CRYPTO_CURRENCY,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_PROVIDER_SELECT,
    type TradingAmountLimitProps,
    type TradingBuyFormProps,
    buyThunks,
    isCountrySubdivisionEmpty,
    mapFiatCurrencyCodeToBaseCurrencyCode,
    selectTradingBuyAmountLimits,
    selectTradingBuyInfo,
    selectTradingBuyIsFromRedirect,
    selectTradingBuyIsLoading,
    selectTradingBuyQuotesByPaymentMethod,
    selectTradingBuyQuotesRequest,
    selectTradingBuySelectedQuote,
    selectTradingVerifiedAddress,
    tradingBuyActions,
    tradingThunks,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { isChanged } from '@trezor/utils';

import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingBuyHandleChange } from 'src/hooks/wallet/trading/form/common/useTradingBuyHandleChange';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingBuyFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingBuyFormDefaultValues';
import { useTradingBuyFormRedirectValues } from 'src/hooks/wallet/trading/form/useTradingBuyFormRedirectValues';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type Dispatch } from 'src/types/suite';
import { type UseTradingFormCommonProps } from 'src/types/trading/trading';
import { type TradingBuyFormContextProps } from 'src/types/trading/tradingForm';
import { createQuoteLink } from 'src/utils/wallet/trading/buyUtils';

import { useTradingClearStaleQuotes } from './common/useTradingClearStaleQuotes';
import { useTradingFiatValues } from './common/useTradingFiatValues';
import { useTradingInitializer } from './common/useTradingInitializer';
import { useTradingFormAccount } from './useTradingFormAccount';
import { useTradingReceiveAddress } from './useTradingReceiveAddress';

export const useTradingBuyForm = ({
    pageType = 'form',
}: UseTradingFormCommonProps = {}): TradingBuyFormContextProps => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const type = 'buy';
    const isFormPage = pageType === 'form';
    const dispatch = useDispatch();

    const buyInfo = useSelector(selectTradingBuyInfo);
    const isFromRedirect = useSelector(selectTradingBuyIsFromRedirect);
    const quotesRequest = useSelector(selectTradingBuyQuotesRequest);
    const selectedQuote = useSelector(selectTradingBuySelectedQuote);
    const amountLimits = useSelector(selectTradingBuyAmountLimits);
    const isLoading = useSelector(selectTradingBuyIsLoading);

    const verifiedAddress = useSelector(selectTradingVerifiedAddress);

    const { device } = useTradingInitializer({
        pageType,
        isLoading,
    });

    const { account, cryptoId } = useTradingFormAccount(type);

    const shouldResetOnInitialBuyInfoLoad = useRef(!buyInfo);

    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const fiatTradingValuesParams = selectedQuote
        ? {
              cryptoId: selectedQuote.receiveCurrency,
              amount: selectedQuote.receiveAmount?.toString(),
              fiatCurrency: mapFiatCurrencyCodeToBaseCurrencyCode(selectedQuote.fiatCurrency),
          }
        : {
              cryptoId: quotesRequest?.receiveCurrency,
              amount: quotesRequest?.cryptoStringAmount,
              fiatCurrency: mapFiatCurrencyCodeToBaseCurrencyCode(quotesRequest?.fiatCurrency),
          };
    useTradingFiatValues(fiatTradingValuesParams);

    const { defaultValues, defaultSubdivision, defaultCountry, defaultCurrency } =
        useTradingBuyFormDefaultValues(cryptoId, buyInfo);
    const redirectValues = useTradingBuyFormRedirectValues(isFromRedirect, quotesRequest);
    const shouldSkipInitialReset = !isFormPage;
    const methods = useForm<TradingBuyFormProps>({
        mode: 'onChange',
        defaultValues: redirectValues || defaultValues,
    });
    const { formState, reset, setValue, handleSubmit, control } = methods;
    const values = useWatch({ control }) as TradingBuyFormProps;
    const { paymentMethod, provider } = values;
    const previousValues = useRef<TradingBuyFormProps | null>(null);

    const isAmountEmpty = !values.fiatInput && !values.cryptoInput;

    const tradingReceiveAddress = useTradingReceiveAddress({
        type: 'buy',
        cryptoId: values.cryptoSelect?.id,
        nonSuiteAccount: !selectedQuote?.tags?.includes('noExternalAddress'),
        pageType,
    });

    const { receiveAddress } = tradingReceiveAddress;
    const isReceiveAddressFormValid =
        Object.keys(tradingReceiveAddress.form.formState.errors).length === 0;

    const noProviders = buyInfo?.buyInfo?.providers.length === 0;
    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = (values.fiatInput || values.cryptoInput) && !!values.currencySelect?.value;
    const isFormLoading = formState.isSubmitting || isLoading;
    const isFormInvalid = !(formIsValid && hasValues) || !isReceiveAddressFormValid;
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    const quotesByPaymentMethod = useSelector(state =>
        selectTradingBuyQuotesByPaymentMethod(state, values?.paymentMethod?.value),
    );
    // based on selected cryptoSymbol, because of using for validation cryptoInput
    const network = getNetwork(
        values.cryptoSelect?.networkSymbol ?? TRADING_DEFAULT_CRYPTO_CURRENCY,
    );

    const { toggleAmountInCrypto: baseToggleAmountInCrypto } = useTradingCurrencySwitcher({
        account,
        methods,
        inputNames: {
            cryptoInput: TRADING_FORM_CRYPTO_INPUT,
            fiatInput: TRADING_FORM_FIAT_INPUT,
        },
    });

    const toggleAmountInCrypto = () => {
        setValue(TRADING_FORM_CRYPTO_INPUT, '');
        setValue(TRADING_FORM_FIAT_INPUT, '');
        baseToggleAmountInCrypto();
    };

    const { handleChange } = useTradingBuyHandleChange({
        formValues: values,
        network,
        shouldSendInSats,
        setValue,
    });

    const selectQuote = async (quote: BuyTrade) => {
        const provider = buyInfo && quote.exchange ? buyInfo.providerInfos[quote.exchange] : null;

        if (!quotesRequest || !provider) return;
        if (!receiveAddress) return;

        const returnUrl = await createQuoteLink(
            { ...quotesRequest, paymentMethod: quote.paymentMethod },
            account,
        );

        analytics.report({
            type: events.tradeBuyEvent.name,
            payload: {
                action: 'continue',
                step: 'buy-form',
                cryptoLabel: values.cryptoSelect?.name,
                cryptoNetworkSymbol: values.cryptoSelect?.networkSymbol,
                cryptoContractAddress: values.cryptoSelect?.contractAddress ?? undefined,
                exchangeName: quote?.exchange,
                paymentMethod: values.paymentMethod?.value,
                countryOfResidence: values.countrySelect?.value,
            },
        });

        await dispatch(
            buyThunks.selectQuoteThunk({
                quote,
                returnUrl,
                loginRequest: form => {
                    dispatch(submitRequestForm(form));
                },
                nextStep: () => {
                    dispatch(goto({ routeName: 'wallet-trading-buy-confirm' }));
                },
            }),
        );
    };

    const verifyAddress =
        (account: Account, address: string | undefined, path: string | undefined) =>
        async (dispatch: Dispatch) => {
            await dispatch(
                tradingThunks.verifyAddressThunk({
                    account,
                    address,
                    path,
                }),
            );
        };

    useEffect(() => {
        setValue('receiveAddress', receiveAddress);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [receiveAddress]);

    const onQuoteSelected = useCallback(
        (quote: BuyTrade) => {
            const quoteProvider = quote.exchange;
            const quotePaymentMethod = quote.paymentMethod;

            if (quoteProvider && quoteProvider !== provider) {
                setValue(TRADING_FORM_PROVIDER_SELECT, quoteProvider);
            }

            if (quotePaymentMethod && paymentMethod?.value !== quotePaymentMethod) {
                setValue(TRADING_FORM_PAYMENT_METHOD_SELECT, {
                    value: quotePaymentMethod,
                    label: quote.paymentMethodName ?? quotePaymentMethod,
                });
            }
        },
        [paymentMethod, provider, setValue],
    );

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: type }));
    }, [dispatch]);

    // call change handler on every change of text inputs with debounce
    useDebounce(
        () => {
            if (pageType === 'confirm') {
                return;
            }

            if (
                isChanged(previousValues.current?.fiatInput, values.fiatInput) ||
                isChanged(previousValues.current?.cryptoInput, values.cryptoInput)
            ) {
                handleSubmit(() => {
                    handleChange();
                })();

                previousValues.current = values;
            }
        },
        500,
        [
            previousValues,
            values.fiatInput,
            values.cryptoInput,
            pageType,
            handleChange,
            handleSubmit,
        ],
    );

    useTradingClearStaleQuotes({ type, isEnabled: isFormPage, isAmountEmpty });

    // call change handler on every change of select inputs
    useEffect(() => {
        if (pageType === 'confirm') {
            return;
        }

        if (!values.cryptoSelect || !values.countrySelect || !values.currencySelect) {
            return;
        }

        if (
            isCountrySubdivisionEmpty(
                values.countrySelect?.value,
                values.countrySubdivisionSelect?.value,
            )
        ) {
            return;
        }

        if (
            isChanged(previousValues.current?.cryptoSelect, values.cryptoSelect) ||
            isChanged(previousValues.current?.countrySelect, values.countrySelect) ||
            isChanged(
                previousValues.current?.countrySubdivisionSelect,
                values.countrySubdivisionSelect,
            ) ||
            isChanged(previousValues.current?.currencySelect, values.currencySelect) ||
            isChanged(previousValues.current?.receiveAddress, values?.receiveAddress) ||
            isChanged(previousValues.current?.cryptoSelect.id, values?.cryptoSelect.id)
        ) {
            handleSubmit(() => {
                handleChange();
            })();

            previousValues.current = values;
        }
    }, [previousValues, values, isFormPage, pageType, handleChange, handleSubmit]);

    useEffect(() => {
        // bind actual default values when we've got buyInfo from Invity API server
        if (!shouldSkipInitialReset && buyInfo && shouldResetOnInitialBuyInfoLoad.current) {
            shouldResetOnInitialBuyInfoLoad.current = false;
            const currentReceiveAddress = values.receiveAddress;
            reset({
                ...defaultValues,
                receiveAddress: currentReceiveAddress,
            });
        }
    }, [reset, buyInfo, defaultValues, shouldSkipInitialReset, values.receiveAddress]);

    useEffect(() => {
        // We need to clear quotes on offers page without redirecting to form page
        if (!quotesRequest && !isFormPage) {
            dispatch(goto({ routeName: 'wallet-trading-buy' }));

            return;
        }
    }, [quotesRequest, isFormPage, dispatch]);

    useEffect(() => {
        if (isFromRedirect && quotesRequest) {
            dispatch(goto({ routeName: 'wallet-trading-buy-confirm' }));
        }
    }, [isFromRedirect, quotesRequest, dispatch]);

    return {
        type,
        form: {
            state: {
                isFormLoading,
                isFormInvalid,
                isLoadingOrInvalid,

                toggleAmountInCrypto,
            },
        },
        ...methods,
        methods,
        account,
        defaultCountry,
        defaultSubdivision,
        defaultCurrency,
        buyInfo,
        amountLimits,
        network,
        cryptoInputValue: values.cryptoInput,
        device,
        verifiedAddress,
        quotes: quotesByPaymentMethod,
        quotesRequest,
        selectedQuote,
        tradingReceiveAddress,
        isAmountEmpty,
        selectQuote,
        onQuoteSelected,
        verifyAddress,
        setAmountLimits: (limits: TradingAmountLimitProps | undefined) => {
            dispatch(tradingBuyActions.setAmountLimits(limits));
        },
        clearQuotesAndParams: () => {
            dispatch(tradingBuyActions.clearQuotesAndParams());
        },
    };
};
