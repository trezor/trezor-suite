import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    exchangeThunks,
    parseCryptoId,
    selectTradingExchangeIsLoading,
    selectTradingMaxSlippagePercentage,
    tokenSupportsIncreasingAllowance,
} from '@suite-common/trading';
import {
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import {
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
} from '@suite-native/trading-state';
import { ExchangeFormType } from '@suite-native/trading-types';
import { useTimer } from '@trezor/react-utils';

import { useExchangeAnalyticReportCallback } from './useExchangeAnalyticReportCallback';
import { clearExchangeFormQuoteData } from './useExchangeForm';
import { getApprovalStatus } from '../../utils/general/approvalStatusUtils';
import { isFullySelectedReceiveAccount } from '../../utils/general/receiveAccountUtils';
import { useConsent } from '../general/useConsent';
import { useConsentDenier } from '../general/useConsentDenier';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

export const useExchangeSelectQuote = (form: ExchangeFormType) => {
    const dispatch = useDispatch();
    const timer = useTimer();

    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const receiveAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const swapSlippage = useSelector(selectTradingMaxSlippagePercentage);

    const navigation = useNavigation<NavigationProps>();

    const [candidateQuote, receiveAsset] = form.watch(['quote', 'receiveAsset']);

    const { isConsentRequested, waitForConsent, resolveConsent } = useConsent();
    useConsentDenier(candidateQuote?.exchange, resolveConsent);
    const analyticsReportCallback = useExchangeAnalyticReportCallback(candidateQuote);

    const canProceed = !isLoading && !!candidateQuote && !!sendAccount;

    const selectReceiveAccount = () => {
        const selectedNetworkSymbol = getSymbolFromTradeableAsset(receiveAsset);
        if (selectedNetworkSymbol) {
            navigation.navigate(TradingStackRoutes.ReceiveAccounts, {
                symbol: selectedNetworkSymbol,
                tradingType: 'exchange',
            });
        }
    };

    const giveConsent = useCallback(() => {
        resolveConsent(true);
        analyticsReportCallback('exchange-terms-modal', 'continue');
    }, [resolveConsent, analyticsReportCallback]);

    const cancelConsent = useCallback(() => {
        resolveConsent(false);
        analyticsReportCallback('exchange-terms-modal', 'cancel');
    }, [resolveConsent, analyticsReportCallback]);

    const selectQuote = async () => {
        if (!candidateQuote || isLoading) {
            return;
        }

        if (!isFullySelectedReceiveAccount(receiveAccount)) {
            selectReceiveAccount();
            analyticsReportCallback('account-selection', 'continue');

            return;
        }

        await dispatch(
            exchangeThunks.selectQuoteThunk({
                quote: { ...candidateQuote, swapSlippage },
                timer,
                userConsent: waitForConsent,
                nextStep: () => {
                    clearExchangeFormQuoteData(form);

                    const approvalStatus = getApprovalStatus(candidateQuote);
                    if (approvalStatus === 'approved' || approvalStatus === 'not_needed') {
                        return navigation.navigate(TradingStackRoutes.TradingExchangePreview, {});
                    }

                    const { contractAddress } = candidateQuote.send
                        ? parseCryptoId(candidateQuote.send)
                        : {};

                    const isIncreasingAllowanceSupported =
                        tokenSupportsIncreasingAllowance(contractAddress);

                    if (approvalStatus === 'needs_increase' && isIncreasingAllowanceSupported) {
                        return navigation.navigate(TradingStackRoutes.TradingExchangeApproval, {
                            quote: candidateQuote,
                            shouldIncreaseLimit: true,
                        });
                    }

                    if (approvalStatus === 'needs_increase') {
                        return navigation.navigate(TradingStackRoutes.TradingExchangeRevoke, {
                            quote: candidateQuote,
                            shouldIncreaseLimit: true,
                        });
                    }

                    return navigation.navigate(TradingStackRoutes.TradingExchangeApproval, {
                        quote: candidateQuote,
                    });
                },
                onCancel: () => {},
            }),
        );
    };

    return {
        canProceed,
        candidateQuote,
        sendAccount,
        receiveAccount,
        isLoading,
        isConsentRequested,
        giveConsent,
        cancelConsent,
        selectReceiveAccount,
        selectQuote,
    };
};
