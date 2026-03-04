import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { BankAccount, CryptoId, SellFiatTrade, SellFiatTradeResponse } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';

import { events } from '@suite/analytics';
import { TranslationKey, useTranslation } from '@suite/intl';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_PROVIDER_SELECT,
    type TradingAmountLimitProps,
    type TradingSellFormProps,
    type TradingSellType,
    type TradingSendRejectedProps,
    type TradingSignAndPushSendFormTransactionProps,
    type TradingTransactionSell,
    getTradingQuotesByPaymentMethod,
    selectTradingComposedTransactionInfo,
    selectTradingIsSlip24Allowed,
    selectTradingPaymentMethods,
    selectTradingSell,
    selectTradingTrades,
    sellThunks,
    sellUtils,
    tradingActions,
    tradingSellActions,
    tradingThunks,
} from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';
import { selectBaseCurrency, useFormDraft } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { isChanged } from '@trezor/utils';

import { goto } from 'src/actions/suite/routerActions';
import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSolanaSubscribeBlocks } from 'src/hooks/wallet/form/useSolanaSubscribeBlocks';
import { useTradingComposeTransaction } from 'src/hooks/wallet/trading/form/common/useTradingComposeTransaction';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingFormActions } from 'src/hooks/wallet/trading/form/common/useTradingFormActions';
import { useTradingPreviousRoute } from 'src/hooks/wallet/trading/form/common/useTradingPreviousRoute';
import { useTradingSellHandleChange } from 'src/hooks/wallet/trading/form/common/useTradingSellHandleChange';
import { useTradingSellFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingSellFormDefaultValues';
import { useTradingSellFormRedirectValues } from 'src/hooks/wallet/trading/form/useTradingSellFormRedirectValues';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { selectHasExperimentalFeature } from 'src/selectors/suite/suiteSelectors';
import { useAnalytics } from 'src/support/useAnalytics';
import { UseTradingFormCommonProps } from 'src/types/trading/trading';
import { TradingSellFormContextProps } from 'src/types/trading/tradingForm';
import { createQuoteLink } from 'src/utils/wallet/trading/sellUtils';

import { useTradingAssetDecimals } from './common/useTradingAssetDecimals';
import { useTradingInitializer } from './common/useTradingInitializer';
import { useTradingFormAccount } from './useTradingFormAccount';

export const useTradingSellForm = ({
    pageType = 'form',
}: UseTradingFormCommonProps = {}): TradingSellFormContextProps => {
    const analytics = useAnalytics();
    const type = 'sell';
    const isFormPage = pageType === 'form';
    const isOffersPage = pageType === 'offers';
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const {
        isLoading,
        quotesRequest,
        isFromRedirect,
        quotes,
        transactionId,
        preselectedQuote,
        selectedQuote,
        sellInfo,
        amountLimits,
    } = useSelector(selectTradingSell);
    const paymentMethods = useSelector(selectTradingPaymentMethods);

    const isPreviousRouteFromTradeSection = useTradingPreviousRoute(type);

    const [showReserveBanner, setShowReserveBanner] = useState<boolean>(false);

    const { account, tradingAccountKey: accountKey, cryptoId } = useTradingFormAccount(type);

    const { timer, device, checkQuotesTimer } = useTradingInitializer({
        pageType,
        isLoading,
    });

    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);
    const { selectedFee, composed } = composedTransactionInfo;

    // we consider this feature enabled unless disabled by message system
    const isSlip24FeatureEnabled = useSelector(state =>
        selectIsFeatureEnabled(state, Feature.trading.slip24, true),
    );
    const isSlip24ExperimentalFeatureEnabled = useSelector(selectHasExperimentalFeature('slip24'));
    const isSlip24Active = useSelector(state =>
        selectTradingIsSlip24Allowed(
            state,
            account,
            isSlip24FeatureEnabled && isSlip24ExperimentalFeatureEnabled,
        ),
    );

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const network = networks[account.symbol];
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const localCurrencyOption = { value: baseCurrencyCode, label: baseCurrencyCode.toUpperCase() };
    const trades = useSelector(selectTradingTrades);
    const trade = trades.find(
        (trade): trade is TradingTransactionSell =>
            trade.tradeType === 'sell' && trade.key === transactionId,
    );

    const {
        defaultValues,
        defaultCountry,
        defaultSubdivision,
        defaultCurrency,
        defaultPaymentMethod,
    } = useTradingSellFormDefaultValues(
        accountKey,
        cryptoId,
        sellInfo?.country,
        sellInfo?.countrySubdivision,
    );
    const redirectValues = useTradingSellFormRedirectValues(isFromRedirect, quotesRequest);
    const { saveDraft, draft, removeDraft } = useFormDraft<TradingSellFormProps>('trading-sell');
    const getDraftUpdated = (): TradingSellFormProps | null => {
        if (!draft) return null;
        if (isPreviousRouteFromTradeSection) {
            const outputs = draft.outputs?.map(output => ({
                ...output,
                fiat: output.fiat ?? '',
            }));

            return {
                ...draft,
                outputs,
            };
        }

        return {
            ...defaultValues,
            paymentMethod: draft.paymentMethod,
            countrySelect: draft.countrySelect,
            countrySubdivisionSelect: draft.countrySubdivisionSelect,
            amountInCrypto: draft.amountInCrypto,
        };
    };
    const draftUpdated = getDraftUpdated();

    const isDraft = !!draft;
    const methods = useForm<TradingSellFormProps>({
        mode: 'onChange',
        defaultValues: redirectValues ?? draftUpdated ?? defaultValues,
    });
    const { register, setValue, reset, control, formState } = methods;
    const values = useWatch<TradingSellFormProps>({ control });
    const { paymentMethod, provider } = values;

    const formIsValid = Object.keys(formState.errors).length === 0;
    const output = values.outputs?.[0];
    const hasValues = !!output?.amount;
    const isAmountEmpty = output?.amount === '';
    const noProviders = Object.keys(sellInfo?.providerInfos ?? {}).length === 0;
    const isInitialDataLoading = !sellInfo?.providerInfos;
    const isFormLoading = isInitialDataLoading || formState.isSubmitting || isLoading;
    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;
    const quotesByPaymentMethod = getTradingQuotesByPaymentMethod<TradingSellType>(
        quotes,
        values?.paymentMethod?.value ?? '',
    );
    const { getAssetDecimals } = useTradingAssetDecimals();
    const decimals = useMemo(
        () =>
            getAssetDecimals({
                accountKey: values.sendCryptoSelect?.accountKey as AccountKey,
                cryptoId: values.sendCryptoSelect?.id as CryptoId,
            }),
        [getAssetDecimals, values.sendCryptoSelect?.accountKey, values.sendCryptoSelect?.id],
    );

    const setAmountLimits = (limits: TradingAmountLimitProps | undefined) => {
        dispatch(tradingSellActions.setAmountLimits(limits));
    };

    const {
        isComposing,
        composedLevels,
        feeInfo,
        changeFeeLevel,
        setComposedLevels,
        composeRequest,
    } = useTradingComposeTransaction<TradingSellFormProps>({
        type: 'sell',
        account,
        network,
        values: values as TradingSellFormProps,
        methods,
        setShowReserveBanner,
    });

    const { toggleAmountInCrypto } = useTradingCurrencySwitcher<TradingSellFormProps>({
        account,
        methods,
        inputNames: {
            cryptoInput: TRADING_FORM_OUTPUT_AMOUNT,
            fiatInput: TRADING_FORM_OUTPUT_FIAT,
        },
    });

    const { handleChange } = useTradingSellHandleChange({
        formValues: values as TradingSellFormProps,
        network,
        timer,
        shouldSendInSats,
        composeRequestCallback: () => {
            composeRequest(TRADING_FORM_OUTPUT_AMOUNT);
        },
        setValue,
    });

    const helpers = useTradingFormActions({
        account,
        methods,
        pageType,
        draftUpdated,
        type,
        handleChange,
        setAmountLimits,
        changeFeeLevel,
        composeRequest,
        setComposedLevels,
        setAccountOnChange: newAccount => {
            dispatch(tradingSellActions.setTradingAccountKey(newAccount.key));
        },
        composedLevels,
        composedTransactionInfo,
        setShowReserveBanner,
    });

    const getCommonFunctions = async (quote: SellFiatTrade) => {
        const provider =
            sellInfo?.providerInfos && quote.exchange
                ? sellInfo.providerInfos[quote.exchange]
                : undefined;
        if (!quotesRequest || !provider) return;

        const orderId = provider.flow === 'PAYMENT_GATE' ? quote.orderId : undefined;

        const returnUrl = await createQuoteLink(
            {
                ...quotesRequest,
                country: quotesRequest.country ?? quote.country,
                fiatCurrency: quotesRequest.fiatCurrency ?? quote.fiatCurrency,
                amountInCrypto: quotesRequest.amountInCrypto ?? quote.amountInCrypto,
                cryptoStringAmount: quotesRequest.cryptoStringAmount ?? quote.cryptoStringAmount,
                fiatStringAmount: quotesRequest.fiatStringAmount ?? quote.fiatStringAmount,
                cryptoCurrency: quotesRequest.cryptoCurrency ?? quote.cryptoCurrency,
                paymentMethod: quote.paymentMethod,
            },
            account,
            { selectedFee, composed },
            orderId,
        );

        const processResponseData = (response: SellFiatTradeResponse) => {
            dispatch(submitRequestForm(response.tradeForm?.form));
        };

        return {
            returnUrl,
            processResponseData,
        };
    };

    const doSellTrade = async (trade: SellFiatTrade) => {
        const commonFunctions = await getCommonFunctions(trade);

        if (!commonFunctions) return;

        const { returnUrl, processResponseData } = commonFunctions;

        await dispatch(
            sellThunks.handleTradeThunk({
                account,
                trade,
                returnUrl,
                processResponseData,
            }),
        );
    };

    const goToOffers = async () => {
        await handleChange();

        dispatch(tradingSellActions.setTradingAccountKey(account.key)); // save account for offers page
        dispatch(goto('wallet-trading-sell-offers'));

        analytics.report({
            type: events.tradeCompareOffersEvent.name,
            payload: {
                type: 'sell',
            },
        });
    };

    const selectQuote = async (quote: SellFiatTrade) => {
        const provider = sellInfo && quote.exchange ? sellInfo.providerInfos[quote.exchange] : null;

        if (!quotesRequest || !provider) return;

        switch (pageType) {
            case 'form': {
                analytics.report({
                    type: events.tradeSellEvent.name,
                    payload: {
                        action: 'continue',
                        step: 'sell-form',
                        cryptoLabel: draftUpdated?.sendCryptoSelect?.displaySymbol,
                        cryptoNetworkSymbol: draftUpdated?.sendCryptoSelect?.networkSymbol,
                        cryptoContractAddress:
                            draftUpdated?.sendCryptoSelect?.contractAddress ?? undefined,
                        exchangeName: quote?.exchange,
                        receiveMethod: draftUpdated?.paymentMethod?.value,
                        countryOfResidence: draftUpdated?.countrySelect?.value,
                        fractionButton: helpers.fractionButton
                            ? `${(100 / helpers.fractionButton).toString()}%`
                            : undefined,
                    },
                });
                break;
            }
            case 'offers': {
                analytics.report({
                    type: events.tradeSellEvent.name,
                    payload: {
                        action: 'continue',
                        step: 'offers-form',
                        exchangeName: quote?.exchange,
                        receiveMethod: draftUpdated?.paymentMethod?.value,
                        countryOfResidence: draftUpdated?.countrySelect?.value,
                    },
                });
                break;
            }
        }

        const nextStep = () => {
            dispatch(goto('wallet-trading-sell-confirm'));

            // empty quoteId means the partner requests login first, requestTrade to get login screen
            if (
                (sellInfo && sellUtils.needToRegisterOrVerifyBankAccount({ quote, sellInfo })) ||
                !quote.quoteId
            ) {
                doSellTrade(quote);
            }
        };

        await dispatch(
            sellThunks.selectQuoteThunk({
                quote,
                timer,
                nextStep,
            }),
        );
    };

    const confirmTrade = async (bankAccount: BankAccount) => {
        if (!selectedQuote) return;

        const quote = { ...selectedQuote, bankAccount };
        const commonFunctions = await getCommonFunctions(quote);

        if (!commonFunctions) return;

        const { returnUrl, processResponseData } = commonFunctions;

        const triggerAnalyticsTradeConfirmation = () => {
            analytics.report({
                type: events.tradeConfirmTradeEvent.name,
                payload: { action: type },
            });
        };

        await dispatch(
            sellThunks.confirmTradeThunk({
                account,
                bankAccount,
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
            }),
        );
    };

    const addBankAccount = async () => {
        if (!selectedQuote) return;

        await doSellTrade(selectedQuote);
    };

    const sendTransaction = async () => {
        const nextStep = () => {
            dispatch(goto('wallet-trading-sell-detail'));
        };

        const signAndPushSendFormTransaction = async ({
            formState,
            precomposedTransaction,
            selectedAccount,
            paymentRequests,
        }: TradingSignAndPushSendFormTransactionProps) =>
            await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount,
                    paymentRequests,
                }),
            ).unwrap();

        try {
            await dispatch(
                sellThunks.sendTransactionThunk({
                    account,
                    trade: trade?.data,
                    shouldSendInSats,
                    decimals,
                    formValues: values as TradingSellFormProps,
                    // TODO: slip24 - exclude from debug mode
                    isSlip24Active,
                    nextStep,
                    signAndPushSendFormTransaction,
                }),
            ).unwrap();

            return true;
        } catch (e) {
            const errorTyped = e as TradingSendRejectedProps<TranslationKey>;

            if (errorTyped.type !== 'sign-transaction-timeout') {
                dispatch(
                    notificationsActions.addToast({
                        type: errorTyped.type,
                        error: translationString(errorTyped.error.id, errorTyped.error.values),
                    }),
                );
            }

            return false;
        }
    };

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: type }));
    }, [dispatch]);

    useEffect(() => {
        if (!preselectedQuote) {
            return;
        }

        const preselectedProvider = preselectedQuote.exchange;
        const preselectedPaymentMethod = preselectedQuote.paymentMethod;
        const shouldUpdateProvider = !!preselectedProvider && preselectedProvider !== provider;
        const shouldUpdatePaymentMethod =
            !!preselectedPaymentMethod && paymentMethod?.value !== preselectedPaymentMethod;

        dispatch(tradingSellActions.savePreselectedQuote(undefined));

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
        if (!isChanged(defaultValues, values)) {
            removeDraft();

            return;
        }

        if (!values.outputs?.[0]?.currency?.value) {
            removeDraft();
        }
    }, [defaultValues, values, removeDraft]);

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('options');
        register('outputs');
        register('setMaxOutputId');
    }, [register]);

    useEffect(() => {
        // when draft doesn't exist, we need to bind actual default values - that happens when we've got sellInfo from Invity API server
        if (!isDraft && sellInfo && isInitialDataLoading) {
            reset(defaultValues);
        }
    }, [reset, sellInfo, defaultValues, isDraft, isFormPage, isInitialDataLoading]);

    useDebounce(
        () => {
            // saving draft after validation & transaction composing & when sellInfo is available
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0 &&
                !isComposing &&
                sellInfo
            ) {
                saveDraft(values as TradingSellFormProps);
            }
        },
        200,
        [
            saveDraft,
            values,
            formState.errors,
            formState.isDirty,
            formState.isValidating,
            isComposing,
        ],
    );

    useEffect(() => {
        // We need to clear quotes on offers page without redirecting to form page
        if (!quotesRequest && !isFormPage && !isOffersPage) {
            dispatch(goto('wallet-trading-sell'));

            return;
        }
    }, [quotesRequest, isFormPage, isOffersPage, dispatch]);

    useEffect(() => {
        if (isFromRedirect) {
            if (transactionId && trade && pageType !== 'retry') {
                dispatch(tradingSellActions.saveSelectedQuote(trade.data));
                dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
            }

            dispatch(tradingSellActions.setIsFromRedirect(false));
        }
    }, [isFromRedirect, trade, transactionId, pageType, dispatch]);

    useEffect(() => {
        checkQuotesTimer(handleChange);
    }, [checkQuotesTimer, handleChange]);

    // Subscribe to blocks for Solana, since they are not fetched globally
    useSolanaSubscribeBlocks(account);

    return {
        type,
        form: {
            state: {
                isFormLoading,
                isFormInvalid,
                isLoadingOrInvalid,

                toggleAmountInCrypto,
            },
            helpers,
        },
        ...methods,
        methods,
        account,
        defaultCountry,
        defaultSubdivision,
        defaultCurrency,
        defaultPaymentMethod,
        paymentMethods,
        sellInfo,
        quotesRequest,
        quotes: quotesByPaymentMethod,
        composedLevels,
        composedTransactionInfo,
        localCurrencyOption,
        feeInfo,
        isComposing,
        amountLimits,
        network,
        device,
        timer,
        preselectedQuote,
        selectedQuote,
        shouldSendInSats,
        trade,
        isAmountEmpty,
        changeFeeLevel,
        composeRequest,
        setAmountLimits,
        addBankAccount,
        confirmTrade,
        goToOffers,
        selectQuote,
        sendTransaction,
        showReserveBanner,
        setShowReserveBanner,
        clearQuotesAndParams: () => {
            dispatch(tradingActions.savePaymentMethods([]));
            dispatch(tradingSellActions.clearQuotesAndParams());
        },
    };
};
