import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { ExchangeTrade, FormResponse } from 'invity-api';

import {
    exchangeThunks,
    selectTradingExchangeAccountKey,
    selectTradingExchangeIsLoading,
    selectTradingExchangeReceiveAccountKey,
} from '@suite-common/trading';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
    StackToStackCompositeNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { useTimer } from '@trezor/react-utils';

import { clearExchangeFormQuoteData } from './useExchangeForm';
import { ExchangeFormType } from '../../types/exchange';
import { buildTradingUrl, getSourceForForm } from '../../utils/general/formUtils';
import { getSymbolFromTradeableAsset } from '../../utils/general/tradeableAssetUtils';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

type TradingExchangeConfirmTradeProps = {
    receiveAddress: string;
    extraField?: string;
    trade?: ExchangeTrade;
    approvalFlow?: boolean;
};

type ApprovalStatus = 'approved' | 'needs_approval' | 'not_needed' | null;

let consentResolver: ((confirmed: boolean) => void) | null = null;

const waitForConsent = (): Promise<boolean> =>
    new Promise(resolve => {
        consentResolver = resolve;
    });

const resolveConsent = (confirmed: boolean) => {
    consentResolver?.(confirmed);
    consentResolver = null;
};

const INVALID_RECEIVE_ADDRESS = 'invalid_receive_address';

export const getApprovalStatus = (candidateQuote?: ExchangeTrade): ApprovalStatus => {
    if (!candidateQuote) {
        return null;
    }

    if (candidateQuote.preapprovedStringAmount) {
        return 'approved';
    }

    if (candidateQuote.isDex) {
        return 'needs_approval';
    }

    return 'not_needed';
};

export const useExchangeFlow = (form: ExchangeFormType) => {
    const dispatch = useDispatch();
    const timer = useTimer();

    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const sendAccountKey = useSelector(selectTradingExchangeAccountKey);
    const receiveAccountKey = useSelector(selectTradingExchangeReceiveAccountKey);
    const sendAccount = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, sendAccountKey),
    );
    const receiveAccount = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, receiveAccountKey),
    );

    const navigation = useNavigation<NavigationProps>();
    const rootNavigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const [isConsentRequested, setIsConsentRequested] = useState(false);

    const [candidateQuote, receiveAsset] = form.watch(['quote', 'receiveAsset']);

    const canProceed = !isLoading && !!candidateQuote && !!sendAccountKey;

    const approvalStatus = getApprovalStatus(candidateQuote);

    const selectReceiveAccount = () => {
        const selectedNetworkSymbol = getSymbolFromTradeableAsset(receiveAsset);
        if (selectedNetworkSymbol) {
            navigation.navigate(TradingStackRoutes.ReceiveAccounts, {
                symbol: selectedNetworkSymbol,
                tradingType: 'exchange',
            });
        }
    };

    const handleConsent = useMemo(
        () => ({
            give: () => {
                resolveConsent(true);
                setIsConsentRequested(false);
            },
            cancel: () => {
                resolveConsent(false);
                setIsConsentRequested(false);
            },
            request: async () => {
                setIsConsentRequested(true);

                return await waitForConsent();
            },
        }),
        [],
    );

    const handleWebview = (formData: FormResponse['form'], returnUrl: string) => {
        const source = getSourceForForm(formData);
        if (!source) {
            return;
        }

        rootNavigation.navigate(RootStackRoutes.TradingWebView, {
            closeCallbackUrl: returnUrl,
            source,
            orderId: candidateQuote?.orderId,
        });
    };

    const confirmTrade = async ({
        receiveAddress,
        extraField,
        trade,
        approvalFlow,
    }: TradingExchangeConfirmTradeProps): Promise<boolean> => {
        if (!trade || !sendAccount) {
            return false;
        }

        const returnUrl = buildTradingUrl({
            actionType: 'trade',
            tradeType: 'exchange',
            orderId: trade.orderId,
            exchange: trade.exchange,
        });

        clearExchangeFormQuoteData(form);

        return await dispatch(
            exchangeThunks.confirmTradeThunk({
                returnUrl,
                receiveAddress,
                account: sendAccount,
                extraField,
                trade,
                approvalFlow,
                triggerAnalyticsTradeConfirmation: () => {},
                processResponseData: formResponse =>
                    handleWebview(formResponse.tradeForm?.form, returnUrl),
                nextStep: () => {},
            }),
        ).unwrap();
    };

    const selectQuote = async () => {
        if (!candidateQuote || isLoading) {
            return;
        }

        if (!receiveAccountKey) {
            selectReceiveAccount();

            return;
        }

        await dispatch(
            exchangeThunks.selectQuoteThunk({
                quote: candidateQuote,
                timer,
                userConsent: handleConsent.request,
                nextStep: () => {
                    confirmTrade({
                        receiveAddress:
                            receiveAccount?.addresses?.unused?.[0]?.address ??
                            receiveAccount?.descriptor ??
                            INVALID_RECEIVE_ADDRESS,
                        trade: candidateQuote,
                        approvalFlow: false,
                    });
                },
                onCancel: () => {},
            }),
        );
    };

    return {
        canProceed,
        approvalStatus,
        selectQuote,
        confirmTrade,
        isConsentRequested,
        giveConsent: handleConsent.give,
        cancelConsent: handleConsent.cancel,
    };
};
