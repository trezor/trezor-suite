import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type TradingRootState,
    exchangeThunks,
    getApprovalStatus,
    requiresTokenApproval,
    selectTradingExchangeDexQuoteApprovalPrefetchLoadingByQuoteId,
    selectTradingExchangeIsLoading,
    selectTradingMaxSlippagePercentage,
    tradingExchangeActions,
} from '@suite-common/trading';
import {
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
    type TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { useExchangeAnalyticReportCallback } from '@suite-native/trading-analytics';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import {
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
} from '@suite-native/trading-state';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { useNullTimer } from '@trezor/react-utils';
import { exhaustive } from '@trezor/type-utils';

import { clearExchangeFormQuoteData } from './useExchangeForm';
import { isFullySelectedReceiveAccount } from '../../utils/general/receiveAccountUtils';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

export const useExchangeSelectQuote = (form: ExchangeFormType) => {
    const dispatch = useDispatch();
    const timer = useNullTimer();
    const [candidateQuote, receiveAsset] = form.watch(['quote', 'receiveAsset']);

    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const isDexQuoteApprovalPrefetchLoadingForCandidateQuote = useSelector(
        (state: TradingRootState) =>
            selectTradingExchangeDexQuoteApprovalPrefetchLoadingByQuoteId(
                state,
                candidateQuote?.quoteId,
            ),
    );
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const receiveAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const swapSlippage = useSelector(selectTradingMaxSlippagePercentage);

    const navigation = useNavigation<NavigationProps>();

    const analyticsReportCallback = useExchangeAnalyticReportCallback(candidateQuote);
    const isCandidateQuotePrefetchBlocked =
        !!candidateQuote &&
        requiresTokenApproval(candidateQuote) &&
        isDexQuoteApprovalPrefetchLoadingForCandidateQuote;

    const canProceed =
        !isLoading && !isCandidateQuotePrefetchBlocked && !!candidateQuote && !!sendAccount;

    const selectReceiveAccount = () => {
        const selectedNetworkSymbol = getSymbolFromTradeableAsset(receiveAsset);
        if (selectedNetworkSymbol) {
            navigation.navigate(TradingStackRoutes.ReceiveAccounts, {
                symbol: selectedNetworkSymbol,
                tradingType: 'exchange',
            });
        }
    };

    const selectQuote = async () => {
        if (!candidateQuote || isLoading || isCandidateQuotePrefetchBlocked) {
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
                nextStep: () => {
                    clearExchangeFormQuoteData(form);

                    const approvalStatus = getApprovalStatus(candidateQuote);
                    if (approvalStatus === 'approved' || approvalStatus === 'not_needed') {
                        return navigation.navigate(TradingStackRoutes.TradingExchangePreview, {});
                    }

                    dispatch(tradingExchangeActions.savePreselectedQuote(candidateQuote));

                    switch (approvalStatus) {
                        case 'needs_increase':
                            return navigation.navigate(TradingStackRoutes.TradingExchangeApproval, {
                                shouldIncreaseLimit: true,
                            });

                        case 'needs_revoke':
                            return navigation.navigate(TradingStackRoutes.TradingExchangeRevoke, {
                                shouldIncreaseLimit: true,
                            });

                        case 'needs_approval':
                            return navigation.navigate(
                                TradingStackRoutes.TradingExchangeApproval,
                                {},
                            );

                        case null:
                            // do nothing (should not happen when quote is defined)
                            return;

                        default:
                            return exhaustive(approvalStatus);
                    }
                },
            }),
        );
    };

    return {
        canProceed,
        candidateQuote,
        sendAccount,
        receiveAccount,
        isLoading,
        selectReceiveAccount,
        selectQuote,
    };
};
