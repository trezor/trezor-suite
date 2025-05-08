import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { BankAccount, SellFiatTrade, SellFiatTradeResponse } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';

import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type TradingAmountLimitProps,
    type TradingSellFormProps,
    type TradingSellType,
    type TradingSellUserConsentProps,
    type TradingSendRejectedProps,
    type TradingSignAndPushSendFormTransactionProps,
    type TradingTransactionSell,
    getTradingQuotesByPaymentMethod,
    selectTradingComposedTransactionInfo,
    selectTradingPaymentMethods,
    selectTradingSell,
    selectTradingTrades,
    sellThunks,
    sellUtils,
    tradingSellActions,
    tradingThunks,
} from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';
import { selectAccountByKey, selectLocalCurrency } from '@suite-common/wallet-core';
import { EventType, analytics } from '@trezor/suite-analytics';
import { isChanged } from '@trezor/utils';

import { openDeferredModal } from 'src/actions/suite/modalActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
import { FORM_OUTPUT_AMOUNT, FORM_OUTPUT_FIAT } from 'src/constants/wallet/trading/form';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { useSolanaSubscribeBlocks } from 'src/hooks/wallet/form/useSolanaSubscribeBlocks';
import { useTradingAccountKey } from 'src/hooks/wallet/trading/form/common/useTradingAccountKey';
import { useTradingComposeTransaction } from 'src/hooks/wallet/trading/form/common/useTradingComposeTransaction';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingFormActions } from 'src/hooks/wallet/trading/form/common/useTradingFormActions';
import { useTradingPreviousRoute } from 'src/hooks/wallet/trading/form/common/useTradingPreviousRoute';
import { useTradingSellHandleChange } from 'src/hooks/wallet/trading/form/common/useTradingSellHandleChange';
import { useTradingSellFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingSellFormDefaultValues';
import { useTradingSellFormRedirectValues } from 'src/hooks/wallet/trading/form/useTradingSellFormRedirectValues';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useTradingNavigation } from 'src/hooks/wallet/useTradingNavigation';
import {
    TradingAccountOptionsGroupOptionProps,
    UseTradingFormProps,
} from 'src/types/trading/trading';
import { TradingSellFormContextProps } from 'src/types/trading/tradingForm';
import { createQuoteLink } from 'src/utils/wallet/trading/sellUtils';
import {
    getTradingCryptoInfo,
    getTradingNetworkDecimals,
} from 'src/utils/wallet/trading/tradingUtils';

import { useTradingInitializer } from './common/useTradingInitializer';

export const useTradingSellForm = ({
    selectedAccount,
    pageType = 'form',
}: UseTradingFormProps): TradingSellFormContextProps => {
    const type = 'sell';
    const isNotFormPage = pageType !== 'form';
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const {
        isLoading,
        quotesRequest,
        isFromRedirect,
        quotes,
        transactionId,
        tradingAccountKey,
        selectedQuote,
        sellInfo,
        amountLimits,
    } = useSelector(selectTradingSell);
    const paymentMethods = useSelector(selectTradingPaymentMethods);

    const isPreviousRouteFromTradeSection = useTradingPreviousRoute(type);
    const [accountKey, setAccountKey] = useTradingAccountKey({
        type,
        tradingAccountKey,
        selectedAccount,
        shouldUseTradingAccountKey: isPreviousRouteFromTradeSection,
    });
    const accountByKey = useSelector(state => selectAccountByKey(state, accountKey));
    const account = accountByKey ?? selectedAccount.account;

    const { timer, device, checkQuotesTimer } = useTradingInitializer({
        selectedAccount,
        pageType,
        isLoading,
    });

    const { selectedFee, composed } = useSelector(selectTradingComposedTransactionInfo);
    const { navigateToSellForm, navigateToSellOffers, navigateToSellConfirm } =
        useTradingNavigation(account);

    const { symbol } = account;
    const localCurrency = useSelector(selectLocalCurrency);
    const network = networks[account.symbol];
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const localCurrencyOption = { value: localCurrency, label: localCurrency.toUpperCase() };
    const trades = useSelector(selectTradingTrades);
    const trade = trades.find(
        (trade): trade is TradingTransactionSell =>
            trade.tradeType === 'sell' && trade.key === transactionId,
    );

    const { defaultValues, defaultCountry, defaultCurrency, defaultPaymentMethod } =
        useTradingSellFormDefaultValues(account, sellInfo);
    const redirectValues = useTradingSellFormRedirectValues(isFromRedirect, quotesRequest);
    const sellDraftKey = 'trading-sell';
    const { saveDraft, getDraft, removeDraft } = useFormDraft<TradingSellFormProps>(sellDraftKey);
    const draft = getDraft(sellDraftKey);
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
            amountInCrypto: draft.amountInCrypto,
        };
    };
    const draftUpdated = getDraftUpdated();

    const isDraft = !!draft;
    const methods = useForm<TradingSellFormProps>({
        mode: 'onChange',
        defaultValues: redirectValues || (draftUpdated ? draftUpdated : defaultValues),
    });
    const { register, setValue, reset, control, formState } = methods;
    const values = useWatch<TradingSellFormProps>({ control });

    const formIsValid = Object.keys(formState.errors).length === 0;
    const output = values.outputs?.[0];
    const hasValues = !!output?.amount;
    const noProviders = Object.keys(sellInfo?.providerInfos ?? {}).length === 0;
    const isInitialDataLoading = !sellInfo?.providerInfos;
    const isFormLoading = isInitialDataLoading || formState.isSubmitting || isLoading;
    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;
    const quotesByPaymentMethod = getTradingQuotesByPaymentMethod<TradingSellType>(
        quotes,
        values?.paymentMethod?.value ?? '',
    );
    const decimals = getTradingNetworkDecimals({
        sendCryptoSelect: values.sendCryptoSelect as
            | TradingAccountOptionsGroupOptionProps
            | undefined,
        network,
    });

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
        account,
        network,
        values: values as TradingSellFormProps,
        methods,
    });

    const { toggleAmountInCrypto } = useTradingCurrencySwitcher<TradingSellFormProps>({
        account,
        methods,
        network,
        quoteCryptoAmount: quotesByPaymentMethod?.[0]?.cryptoStringAmount,
        quoteFiatAmount: quotesByPaymentMethod?.[0]?.fiatStringAmount,
        inputNames: {
            cryptoInput: FORM_OUTPUT_AMOUNT,
            fiatInput: FORM_OUTPUT_FIAT,
        },
    });

    const { handleChange } = useTradingSellHandleChange({
        formValues: values as TradingSellFormProps,
        network,
        timer,
        shouldSendInSats,
        composeRequestCallback: () => {
            composeRequest(FORM_OUTPUT_AMOUNT);
        },
        setValue,
    });

    const helpers = useTradingFormActions({
        account,
        methods,
        isNotFormPage,
        draftUpdated,
        type,
        handleChange,
        setAmountLimits,
        changeFeeLevel,
        composeRequest,
        setComposedLevels,
        setAccountOnChange: newAccount => {
            dispatch(tradingSellActions.setTradingAccountKey(newAccount.key));
            setAccountKey(newAccount.key);
        },
    });

    const getCommonFunctions = async (quote: SellFiatTrade) => {
        const provider =
            sellInfo?.providerInfos && quote.exchange
                ? sellInfo.providerInfos[quote.exchange]
                : undefined;
        if (!quotesRequest || !provider) return;

        const orderId = provider.flow === 'PAYMENT_GATE' ? quote.orderId : undefined;

        const returnUrl = await createQuoteLink(
            { ...quotesRequest, paymentMethod: quote.paymentMethod },
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

    const doSellTrade = async (quote: SellFiatTrade) => {
        const commonFunctions = await getCommonFunctions(quote);

        if (!commonFunctions) return;

        const { returnUrl, processResponseData } = commonFunctions;

        await dispatch(
            sellThunks.handleTradeThunk({
                account,
                quote,
                returnUrl,
                processResponseData,
            }),
        );
    };

    const goToOffers = async () => {
        await handleChange();

        dispatch(tradingSellActions.setTradingAccountKey(account.key)); // save account for offers page
        navigateToSellOffers();

        const {
            label: cryptoLabel,
            networkSymbol: cryptoNetworkSymbol,
            contractAddress: cryptoContractAddress,
        } = getTradingCryptoInfo(draftUpdated?.sendCryptoSelect);

        analytics.report({
            type: EventType.TradingSell,
            payload: {
                action: 'continue',
                step: 'sell-form',
                cryptoLabel,
                cryptoNetworkSymbol,
                cryptoContractAddress,
                receiveMethod: draftUpdated?.paymentMethod?.value,
                countryOfResidence: draftUpdated?.countrySelect?.value,
                fractionButton: helpers.fractionButton
                    ? `${(100 / helpers.fractionButton).toString()}%`
                    : undefined,
            },
        });
    };

    const selectQuote = async (quote: SellFiatTrade) => {
        const provider = sellInfo && quote.exchange ? sellInfo.providerInfos[quote.exchange] : null;

        if (!quotesRequest || !provider) return;

        const {
            label: cryptoLabel,
            networkSymbol: cryptoNetworkSymbol,
            contractAddress: cryptoContractAddress,
        } = getTradingCryptoInfo(draftUpdated?.sendCryptoSelect);

        switch (pageType) {
            case 'form': {
                analytics.report({
                    type: EventType.TradingSell,
                    payload: {
                        action: 'continue',
                        step: 'sell-form',
                        cryptoLabel,
                        cryptoNetworkSymbol,
                        cryptoContractAddress,
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
                    type: EventType.TradingSell,
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

        const userConsent = async ({ provider, cryptoCurrency }: TradingSellUserConsentProps) =>
            Boolean(
                await dispatch(
                    openDeferredModal({
                        type: 'trading-sell-terms',
                        provider,
                        cryptoCurrency,
                    }),
                ),
            );

        const nextStep = () => {
            analytics.report({
                type: EventType.TradingSell,
                payload: {
                    action: 'continue',
                    step: 'sell-terms-modal',
                },
            });

            navigateToSellConfirm();
        };

        const onCancel = () => {
            analytics.report({
                type: EventType.TradingSell,
                payload: {
                    action: 'cancel',
                    step: 'sell-terms-modal',
                },
            });
        };

        await dispatch(
            sellThunks.selectQuoteThunk({
                quote,
                timer,
                userConsent,
                nextStep,
                onCancel,
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
                type: EventType.TradingConfirmTrade,
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
            dispatch(
                routerActions.goto('wallet-trading-sell-detail', {
                    params: {
                        symbol: selectedAccount.account.symbol,
                        accountIndex: selectedAccount.account.index,
                        accountType: selectedAccount.account.accountType,
                    },
                }),
            );
        };

        const signAndPushSendFormTransaction = async ({
            formState,
            precomposedTransaction,
            selectedAccount,
        }: TradingSignAndPushSendFormTransactionProps) =>
            await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount,
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
                    nextStep,
                    signAndPushSendFormTransaction,
                }),
            ).unwrap();

            return true;
        } catch (e) {
            const errorTyped = e as TradingSendRejectedProps;

            dispatch(
                notificationsActions.addToast({
                    type: errorTyped.type,
                    error: translationString(errorTyped.error.id, errorTyped.error.values),
                }),
            );

            return false;
        }
    };

    // TODO: trading - is it possible to have info data before render?
    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: type }));
    }, [dispatch]);

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(sellDraftKey);

            return;
        }

        if (!values.outputs?.[0]?.currency?.value) {
            removeDraft(sellDraftKey);
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
    }, [reset, sellInfo, defaultValues, isDraft, isNotFormPage, isInitialDataLoading]);

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
                saveDraft(sellDraftKey, values as TradingSellFormProps);
            }
        },
        200,
        [
            saveDraft,
            sellDraftKey,
            values,
            formState.errors,
            formState.isDirty,
            formState.isValidating,
            isComposing,
        ],
    );

    useDebounce(() => {
        // empty quoteId means the partner requests login first, requestTrade to get login screen
        if (
            selectedQuote &&
            pageType === 'confirm' &&
            (!selectedQuote.quoteId ||
                (sellInfo &&
                    sellUtils.needToRegisterOrVerifyBankAccount({
                        quote: selectedQuote,
                        sellInfo,
                    })))
        ) {
            doSellTrade(selectedQuote);
        }
    }, 50);

    useEffect(() => {
        if (!quotesRequest && isNotFormPage) {
            navigateToSellForm();

            return;
        }
    }, [quotesRequest, isNotFormPage, navigateToSellForm]);

    useEffect(() => {
        if (isFromRedirect) {
            if (transactionId && trade) {
                dispatch(tradingSellActions.saveSelectedQuote(trade.data));
                dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
            }

            dispatch(tradingSellActions.setIsFromRedirect(false));
        }
    }, [isFromRedirect, trade, transactionId, dispatch]);

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
        account,
        defaultCountry,
        defaultCurrency,
        defaultPaymentMethod,
        paymentMethods,
        sellInfo,
        quotesRequest,
        quotes: quotesByPaymentMethod,
        composedLevels,
        localCurrencyOption,
        feeInfo,
        isComposing,
        amountLimits,
        network,
        device,
        timer,
        selectedQuote,
        shouldSendInSats,
        trade,
        changeFeeLevel,
        composeRequest,
        setAmountLimits,
        addBankAccount,
        confirmTrade,
        goToOffers,
        selectQuote,
        sendTransaction,
    };
};
