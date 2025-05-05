import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { BuyTrade, BuyTradeResponse, CryptoId } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';

import {
    TRADING_DEFAULT_CRYPTO_CURRENCY,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    TradingAmountLimitProps,
    TradingBuyFormProps,
    type TradingBuyType,
    buyThunks,
    cryptoIdToNetwork,
    getTradingQuotesByPaymentMethod,
    selectTradingBuy,
    selectTradingPaymentMethods,
    tradingBuyActions,
    tradingThunks,
} from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { isDesktop } from '@trezor/env-utils';
import { EventType, analytics } from '@trezor/suite-analytics';
import { isChanged } from '@trezor/utils';

import { openDeferredModal } from 'src/actions/suite/modalActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingBuyHandleChange } from 'src/hooks/wallet/trading/form/common/useTradingBuyHandleChange';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingPreviousRoute } from 'src/hooks/wallet/trading/form/common/useTradingPreviousRoute';
import { useTradingBuyFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingBuyFormDefaultValues';
import { useTradingBuyFormRedirectValues } from 'src/hooks/wallet/trading/form/useTradingBuyFormRedirectValues';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useTradingNavigation } from 'src/hooks/wallet/useTradingNavigation';
import { selectIsTradingTermsDismissed } from 'src/reducers/suite/suiteReducer';
import { Dispatch } from 'src/types/suite';
import { UseTradingFormProps } from 'src/types/trading/trading';
import {
    TradingBuyConfirmTradeProps,
    TradingBuyFormContextProps,
} from 'src/types/trading/tradingForm';
import { createQuoteLink, createTxLink } from 'src/utils/wallet/trading/buyUtils';
import { getTradingCryptoInfo } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingInitializer } from './common/useTradingInitializer';

export const useTradingBuyForm = ({
    selectedAccount,
    pageType = 'form',
}: UseTradingFormProps): TradingBuyFormContextProps => {
    const type = 'buy';
    const isNotFormPage = pageType !== 'form';
    const dispatch = useDispatch();
    const {
        addressVerified,
        buyInfo,
        isFromRedirect,
        quotes,
        quotesRequest,
        selectedQuote,
        amountLimits,
        isLoading,
    } = useSelector(selectTradingBuy);
    const paymentMethods = useSelector(selectTradingPaymentMethods);
    const isTradingTermsDismissed = useSelector(state =>
        selectIsTradingTermsDismissed(state, type),
    );
    const { account, timer, device, checkQuotesTimer } = useTradingInitializer({
        selectedAccount,
        pageType,
        isLoading,
    });
    const { navigateToBuyForm, navigateToBuyOffers, navigateToBuyConfirm } =
        useTradingNavigation(account);

    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const isPreviousRouteFromTradeSection = useTradingPreviousRoute(type);

    const {
        defaultValues,
        defaultCountry,
        defaultCurrency,
        defaultPaymentMethod,
        suggestedFiatCurrency,
    } = useTradingBuyFormDefaultValues(account.symbol, buyInfo);
    const redirectValues = useTradingBuyFormRedirectValues(isFromRedirect, quotesRequest);
    const buyDraftKey = account.key;
    const { saveDraft, getDraft, removeDraft } = useFormDraft<TradingBuyFormProps>('trading-buy');
    const draft = getDraft(buyDraftKey);
    const draftUpdated: TradingBuyFormProps | null = draft
        ? {
              ...draft,
              fiatInput:
                  draft.fiatInput && draft.fiatInput !== ''
                      ? draft.fiatInput
                      : buyInfo?.buyInfo?.defaultAmountsOfFiatCurrencies.get(suggestedFiatCurrency),
              // remember only for offers page
              cryptoSelect: isPreviousRouteFromTradeSection
                  ? draft.cryptoSelect
                  : defaultValues.cryptoSelect,
          }
        : null;

    const isDraft = !!draftUpdated || !!isNotFormPage;
    const methods = useForm<TradingBuyFormProps>({
        mode: 'onChange',
        defaultValues: redirectValues || (isDraft && draftUpdated ? draftUpdated : defaultValues),
    });
    const { register, control, formState, reset, setValue, handleSubmit } = methods;
    const values = useWatch<TradingBuyFormProps>({ control });
    const previousValues = useRef<typeof values | null>(
        !isFromRedirect && isNotFormPage ? draftUpdated : null,
    );

    const isInitialDataLoading = !buyInfo || !buyInfo?.buyInfo;
    const noProviders = !isInitialDataLoading && buyInfo?.buyInfo?.providers.length === 0;
    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = (values.fiatInput || values.cryptoInput) && !!values.currencySelect?.value;
    const isFormLoading = isInitialDataLoading || formState.isSubmitting || isLoading;
    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    const quotesByPaymentMethod = getTradingQuotesByPaymentMethod<TradingBuyType>(
        quotes,
        values?.paymentMethod?.value ?? '',
    );
    // based on selected cryptoSymbol, because of using for validation cryptoInput
    const network =
        cryptoIdToNetwork(
            (values.cryptoSelect?.value as CryptoId) ?? TRADING_DEFAULT_CRYPTO_CURRENCY,
        ) ?? networks.btc;

    const { toggleAmountInCrypto } = useTradingCurrencySwitcher({
        account,
        methods,
        quoteCryptoAmount: quotesByPaymentMethod?.[0]?.receiveStringAmount,
        quoteFiatAmount: quotesByPaymentMethod?.[0]?.fiatStringAmount,
        network,
        inputNames: {
            cryptoInput: TRADING_FORM_CRYPTO_INPUT,
            fiatInput: TRADING_FORM_FIAT_INPUT,
        },
    });

    const { handleChange } = useTradingBuyHandleChange({
        formValues: values as TradingBuyFormProps,
        network,
        timer,
        shouldSendInSats,
        setValue,
    });

    const goToOffers = async () => {
        await handleChange();

        navigateToBuyOffers();

        const {
            label: cryptoLabel,
            networkSymbol: cryptoNetworkSymbol,
            contractAddress: cryptoContractAddress,
        } = getTradingCryptoInfo(draftUpdated?.cryptoSelect);

        analytics.report({
            type: EventType.TradingBuy,
            payload: {
                action: 'continue',
                step: 'buy-form',
                cryptoLabel,
                cryptoNetworkSymbol,
                cryptoContractAddress,
                paymentMethod: draftUpdated?.paymentMethod?.value,
                countryOfResidence: draftUpdated?.countrySelect?.value,
            },
        });
    };

    const selectQuote = async (quote: BuyTrade) => {
        const provider = buyInfo && quote.exchange ? buyInfo.providerInfos[quote.exchange] : null;

        if (!quotesRequest || !provider) return;

        const returnUrl = await createQuoteLink(
            { ...quotesRequest, paymentMethod: quote.paymentMethod },
            account,
        );

        const {
            label: cryptoLabel,
            networkSymbol: cryptoNetworkSymbol,
            contractAddress: cryptoContractAddress,
        } = getTradingCryptoInfo(draftUpdated?.cryptoSelect);

        switch (pageType) {
            case 'form': {
                analytics.report({
                    type: EventType.TradingBuy,
                    payload: {
                        action: 'continue',
                        step: 'buy-form',
                        cryptoLabel,
                        cryptoNetworkSymbol,
                        cryptoContractAddress,
                        exchangeName: quote?.exchange,
                        paymentMethod: draftUpdated?.paymentMethod?.value,
                        countryOfResidence: draftUpdated?.countrySelect?.value,
                    },
                });
                break;
            }
            case 'offers': {
                analytics.report({
                    type: EventType.TradingBuy,
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

        const userConsent = async (provider: string, cryptoCurrency: string) => {
            if (isTradingTermsDismissed) return true;

            const confirmed = await dispatch(
                openDeferredModal({
                    type: 'trading-buy-terms',
                    provider,
                    cryptoCurrency,
                }),
            );

            return Boolean(confirmed);
        };

        await dispatch(
            buyThunks.selectQuoteThunk({
                quote,
                timer,
                returnUrl,
                loginRequest: form => {
                    dispatch(submitRequestForm(form));
                },
                userConsent,
                nextStep: () => {
                    analytics.report({
                        type: EventType.TradingBuy,
                        payload: {
                            action: 'continue',
                            step: 'buy-terms-modal',
                        },
                    });

                    navigateToBuyConfirm();
                },
                onCancel: () => {
                    analytics.report({
                        type: EventType.TradingBuy,
                        payload: {
                            action: 'cancel',
                            step: 'buy-terms-modal',
                        },
                    });
                },
            }),
        );
    };

    const confirmTrade = async ({ receiveAddress }: TradingBuyConfirmTradeProps) => {
        if (!selectedQuote) return;

        const returnUrl = await createTxLink(selectedQuote, account);

        const processResponseData = (response: BuyTradeResponse) => {
            if (response.tradeForm) {
                dispatch(submitRequestForm(response.tradeForm.form));
            }
            if (isDesktop()) {
                if (response.trade.paymentId) {
                    dispatch(tradingBuyActions.saveTransactionId(response.trade.paymentId));
                }
                dispatch(
                    routerActions.goto('wallet-trading-buy-detail', {
                        params: selectedAccount.params,
                    }),
                );
            }
        };

        const triggerAnalyticsTradeConfirmation = () => {
            analytics.report({
                type: EventType.TradingConfirmTrade,
                payload: { action: type },
            });
        };

        await dispatch(
            buyThunks.confirmTradeThunk({
                address: receiveAddress,
                returnUrl,
                account,
                processResponseData,
                triggerAnalyticsTradeConfirmation,
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
                    tradingAction: tradingBuyActions.verifyAddress.type,
                }),
            );
        };

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
            isChanged(previousValues.current?.countrySelect, values.countrySelect) ||
            isChanged(previousValues.current?.currencySelect, values.currencySelect) ||
            isChanged(previousValues.current?.cryptoSelect, values.cryptoSelect)
        ) {
            handleSubmit(() => {
                handleChange();
            })();

            previousValues.current = values;
        }
    }, [previousValues, values, isNotFormPage, pageType, handleChange, handleSubmit]);

    useEffect(() => {
        // when draft doesn't exist, we need to bind actual default values - that happens when we've got buyInfo from Invity API server
        if (!isDraft && buyInfo) {
            reset(defaultValues);
        }
    }, [reset, buyInfo, defaultValues, isDraft]);

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(buyDraftKey);

            return;
        }

        if (values.cryptoSelect && !values.cryptoSelect?.value) {
            removeDraft(buyDraftKey);
        }
    }, [defaultValues, values, removeDraft, buyDraftKey]);

    useEffect(() => {
        if (!quotesRequest && isNotFormPage) {
            navigateToBuyForm();

            return;
        }
    }, [quotesRequest, isNotFormPage, navigateToBuyForm]);

    useEffect(() => {
        if (isFromRedirect && quotesRequest) {
            navigateToBuyConfirm();
        }
    }, [isFromRedirect, quotesRequest, navigateToBuyConfirm]);

    useEffect(() => {
        checkQuotesTimer(handleChange);
    }, [checkQuotesTimer, handleChange]);

    useDebounce(
        () => {
            // saving draft after validation & buyInfo is available
            if (!formState.isValidating && Object.keys(formState.errors).length === 0 && buyInfo) {
                saveDraft(buyDraftKey, {
                    ...values,
                    fiatInput:
                        values.fiatInput !== ''
                            ? values.fiatInput
                            : buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies.get(
                                  suggestedFiatCurrency,
                              ),
                } as TradingBuyFormProps);
            }
        },
        200,
        [
            formState.errors,
            formState.isValidating,
            saveDraft,
            buyDraftKey,
            values,
            shouldSendInSats,
            buyInfo,
        ],
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
        register,
        account,
        defaultCountry,
        defaultCurrency,
        defaultPaymentMethod,
        paymentMethods,
        buyInfo,
        amountLimits,
        network,
        cryptoInputValue: values.cryptoInput,
        formState,
        device,
        addressVerified,
        timer,
        quotes: quotesByPaymentMethod,
        quotesRequest,
        selectedQuote,
        selectQuote,
        confirmTrade,
        goToOffers,
        verifyAddress,
        removeDraft,
        setAmountLimits: (limits: TradingAmountLimitProps | undefined) => {
            dispatch(tradingBuyActions.setAmountLimits(limits));
        },
    };
};
