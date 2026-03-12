import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { BuyTrade, BuyTradeResponse } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';

import { events } from '@suite/analytics';
import { goto } from '@suite/router';
import {
    TRADING_DEFAULT_CRYPTO_CURRENCY,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_PROVIDER_SELECT,
    TradingAmountLimitProps,
    TradingBuyFormProps,
    type TradingBuyType,
    buyThunks,
    getTradingQuotesByPaymentMethod,
    isCountrySubdivisionEmpty,
    mapFiatCurrencyCodeToBaseCurrencyCode,
    selectTradingBuy,
    selectTradingPaymentMethods,
    selectTradingVerifiedAddress,
    tradingActions,
    tradingBuyActions,
    tradingThunks,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { useFormDraft } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { isDesktop } from '@trezor/env-utils';
import { isChanged } from '@trezor/utils';

import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingBuyHandleChange } from 'src/hooks/wallet/trading/form/common/useTradingBuyHandleChange';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingPreviousRoute } from 'src/hooks/wallet/trading/form/common/useTradingPreviousRoute';
import { useTradingBuyFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingBuyFormDefaultValues';
import { useTradingBuyFormRedirectValues } from 'src/hooks/wallet/trading/form/useTradingBuyFormRedirectValues';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useAnalytics } from 'src/support/useAnalytics';
import { Dispatch } from 'src/types/suite';
import { UseTradingFormCommonProps } from 'src/types/trading/trading';
import {
    TradingBuyConfirmTradeProps,
    TradingBuyFormContextProps,
} from 'src/types/trading/tradingForm';
import { createQuoteLink, createTxLink } from 'src/utils/wallet/trading/buyUtils';

import { useTradingFiatValues } from './common/useTradingFiatValues';
import { useTradingInitializer } from './common/useTradingInitializer';
import { useTradingFormAccount } from './useTradingFormAccount';
import { useTradingReceiveAddress } from './useTradingReceiveAddress';

export const useTradingBuyForm = ({
    pageType = 'form',
}: UseTradingFormCommonProps = {}): TradingBuyFormContextProps => {
    const analytics = useAnalytics();
    const type = 'buy';
    const isFormPage = pageType === 'form';
    const isOffersPage = pageType === 'offers';
    const dispatch = useDispatch();
    const {
        buyInfo,
        isFromRedirect,
        quotes,
        quotesRequest,
        preselectedQuote,
        selectedQuote,
        amountLimits,
        isLoading,
    } = useSelector(selectTradingBuy);
    const verifiedAddress = useSelector(selectTradingVerifiedAddress);
    const paymentMethods = useSelector(selectTradingPaymentMethods);

    const { timer, device, checkQuotesTimer } = useTradingInitializer({
        pageType,
        isLoading,
    });

    const { account, cryptoId } = useTradingFormAccount(type);

    const shouldResetOnInitialBuyInfoLoad = useRef(!buyInfo);

    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const isPreviousRouteFromTradeSection = useTradingPreviousRoute(type);

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

    const {
        defaultValues,
        defaultSubdivision,
        defaultCountry,
        defaultCurrency,
        defaultPaymentMethod,
    } = useTradingBuyFormDefaultValues(cryptoId, buyInfo);
    const redirectValues = useTradingBuyFormRedirectValues(isFromRedirect, quotesRequest);
    const { saveDraft, draft, removeDraft } = useFormDraft<TradingBuyFormProps>(
        'trading-buy',
        account.key,
    );
    const draftUpdated: TradingBuyFormProps | null = draft
        ? {
              ...draft,
              fiatInput: draft.fiatInput && draft.fiatInput !== '' ? draft.fiatInput : undefined,
              // remember only for offers page
              cryptoSelect: isPreviousRouteFromTradeSection
                  ? draft.cryptoSelect
                  : defaultValues.cryptoSelect,
          }
        : null;

    const isDraft = !!draftUpdated || !isFormPage;
    const methods = useForm<TradingBuyFormProps>({
        mode: 'onChange',
        defaultValues: redirectValues || (isDraft && draftUpdated ? draftUpdated : defaultValues),
    });
    const { formState, reset, setValue, handleSubmit, control } = methods;
    const values = useWatch({ control }) as TradingBuyFormProps;
    const { paymentMethod, provider } = values;
    const previousValues = useRef<TradingBuyFormProps | null>(
        !isFromRedirect && !isFormPage ? draftUpdated : null,
    );

    const isAmountEmpty = !values.fiatInput && !values.cryptoInput;

    const tradingReceiveAddress = useTradingReceiveAddress({
        type: 'buy',
        cryptoId: values.cryptoSelect?.id,
        isPreviousRouteFromTradeSection,
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

    const quotesByPaymentMethod = getTradingQuotesByPaymentMethod<TradingBuyType>(
        quotes,
        values?.paymentMethod?.value ?? '',
    );
    // based on selected cryptoSymbol, because of using for validation cryptoInput
    const network = getNetwork(
        values.cryptoSelect?.networkSymbol ?? TRADING_DEFAULT_CRYPTO_CURRENCY,
    );

    const { toggleAmountInCrypto } = useTradingCurrencySwitcher({
        account,
        methods,
        inputNames: {
            cryptoInput: TRADING_FORM_CRYPTO_INPUT,
            fiatInput: TRADING_FORM_FIAT_INPUT,
        },
    });

    const { handleChange } = useTradingBuyHandleChange({
        formValues: values,
        network,
        timer,
        shouldSendInSats,
        setValue,
    });

    const goToOffers = async () => {
        await handleChange();

        dispatch(goto({ routeName: 'wallet-trading-buy-offers' }));

        analytics.report({
            type: events.tradeCompareOffersEvent.name,
            payload: {
                type: 'buy',
            },
        });
    };

    const confirmTrade = async ({
        trade,
        receiveAddress,
    }: TradingBuyConfirmTradeProps): Promise<BuyTrade | undefined> => {
        const buyTrade = trade ?? selectedQuote;

        if (!buyTrade) return;

        const returnUrl = await createTxLink(buyTrade, account);

        const processResponseData = (response: BuyTradeResponse) => {
            if (response.tradeForm) {
                dispatch(submitRequestForm(response.tradeForm.form));
            }
            if (isDesktop()) {
                if (response.trade.paymentId) {
                    dispatch(tradingBuyActions.saveTransactionId(response.trade.paymentId));
                }
                dispatch(goto({ routeName: 'wallet-trading-buy-detail' }));
            }
        };

        const triggerAnalyticsTradeConfirmation = () => {
            analytics.report({
                type: events.tradeConfirmTradeEvent.name,
                payload: { action: type },
            });
        };

        return await dispatch(
            buyThunks.confirmTradeThunk({
                quote: buyTrade,
                address: receiveAddress,
                returnUrl,
                account,
                processResponseData,
                triggerAnalyticsTradeConfirmation,
            }),
        ).unwrap();
    };

    const selectQuote = async (quote: BuyTrade) => {
        const provider = buyInfo && quote.exchange ? buyInfo.providerInfos[quote.exchange] : null;

        if (!quotesRequest || !provider) return;
        if (!receiveAddress) return;

        const returnUrl = await createQuoteLink(
            { ...quotesRequest, paymentMethod: quote.paymentMethod },
            account,
        );

        const { name, networkSymbol, contractAddress } = draftUpdated?.cryptoSelect ?? {};

        switch (pageType) {
            case 'form': {
                analytics.report({
                    type: events.tradeBuyEvent.name,
                    payload: {
                        action: 'continue',
                        step: 'buy-form',
                        cryptoLabel: name,
                        cryptoNetworkSymbol: networkSymbol,
                        cryptoContractAddress: contractAddress ?? undefined,
                        exchangeName: quote?.exchange,
                        paymentMethod: draftUpdated?.paymentMethod?.value,
                        countryOfResidence: draftUpdated?.countrySelect?.value,
                    },
                });
                break;
            }
            case 'offers': {
                analytics.report({
                    type: events.tradeBuyEvent.name,
                    payload: {
                        action: 'continue',
                        step: 'offers-form',
                        exchangeName: quote?.exchange,
                        paymentMethod: draftUpdated?.paymentMethod?.value,
                        countryOfResidence: draftUpdated?.countrySelect?.value,
                    },
                });
                break;
            }
        }

        await dispatch(
            buyThunks.selectQuoteThunk({
                quote,
                timer,
                returnUrl,
                loginRequest: form => {
                    dispatch(submitRequestForm(form));
                },
                nextStep: () => {
                    confirmTrade({ trade: quote, receiveAddress });
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

    useEffect(() => {
        if (!preselectedQuote) {
            return;
        }

        const preselectedProvider = preselectedQuote.exchange;
        const preselectedPaymentMethod = preselectedQuote.paymentMethod;
        const shouldUpdateProvider = !!preselectedProvider && preselectedProvider !== provider;
        const shouldUpdatePaymentMethod =
            !!preselectedPaymentMethod && paymentMethod?.value !== preselectedPaymentMethod;

        dispatch(tradingBuyActions.savePreselectedQuote(undefined));

        if (shouldUpdateProvider) {
            setValue(TRADING_FORM_PROVIDER_SELECT, preselectedProvider);
        }

        if (shouldUpdatePaymentMethod) {
            const matchingOption = paymentMethods.find(
                method => method.value === preselectedPaymentMethod,
            );

            setValue(
                TRADING_FORM_PAYMENT_METHOD_SELECT,
                matchingOption ?? {
                    value: preselectedPaymentMethod,
                    label: preselectedQuote.paymentMethodName ?? preselectedPaymentMethod,
                },
            );
        }
    }, [paymentMethod, paymentMethods, preselectedQuote, provider, setValue, dispatch]);

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

    // call change handler on every change of select inputs
    useEffect(() => {
        if (pageType === 'confirm') {
            return;
        }

        if (
            !values.cryptoSelect ||
            !values.countrySelect ||
            !values.receiveAddress ||
            !values.currencySelect
        ) {
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
        // when draft doesn't exist, we need to bind actual default values - that happens when we've got buyInfo from Invity API server
        if (!isDraft && buyInfo && shouldResetOnInitialBuyInfoLoad.current) {
            shouldResetOnInitialBuyInfoLoad.current = false;
            const currentReceiveAddress = values.receiveAddress;
            reset({
                ...defaultValues,
                receiveAddress: currentReceiveAddress,
            });
        }
    }, [reset, buyInfo, defaultValues, isDraft, values.receiveAddress]);

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft();

            return;
        }

        if (values.cryptoSelect && !values.cryptoSelect?.id) {
            removeDraft();
        }
    }, [defaultValues, values, removeDraft]);

    useEffect(() => {
        // We need to clear quotes on offers page without redirecting to form page
        if (!quotesRequest && !isFormPage && !isOffersPage) {
            dispatch(goto({ routeName: 'wallet-trading-buy' }));

            return;
        }
    }, [quotesRequest, isFormPage, isOffersPage, dispatch]);

    useEffect(() => {
        if (isFromRedirect && quotesRequest) {
            dispatch(goto({ routeName: 'wallet-trading-buy-confirm' }));
        }
    }, [isFromRedirect, quotesRequest, dispatch]);

    useEffect(() => {
        checkQuotesTimer(handleChange);
    }, [checkQuotesTimer, handleChange]);

    useDebounce(
        () => {
            // saving draft after validation & buyInfo is available
            if (!formState.isValidating && Object.keys(formState.errors).length === 0 && buyInfo) {
                saveDraft({
                    ...values,
                    fiatInput: values.fiatInput ?? '',
                } as TradingBuyFormProps);
            }
        },
        200,
        [formState.errors, formState.isValidating, saveDraft, values, shouldSendInSats, buyInfo],
    );

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
        defaultPaymentMethod,
        paymentMethods,
        buyInfo,
        amountLimits,
        network,
        cryptoInputValue: values.cryptoInput,
        device,
        verifiedAddress,
        timer,
        quotes: quotesByPaymentMethod,
        quotesRequest,
        preselectedQuote,
        selectedQuote,
        tradingReceiveAddress,
        isAmountEmpty,
        selectQuote,
        confirmTrade,
        goToOffers,
        verifyAddress,
        removeDraft,
        setAmountLimits: (limits: TradingAmountLimitProps | undefined) => {
            dispatch(tradingBuyActions.setAmountLimits(limits));
        },
        clearQuotesAndParams: () => {
            dispatch(tradingBuyActions.clearQuotesAndParams());
            dispatch(tradingActions.savePaymentMethods([]));
        },
    };
};
