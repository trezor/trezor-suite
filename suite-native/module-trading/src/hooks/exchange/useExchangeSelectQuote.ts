import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type ApprovalStatus,
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
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';
import { useExchangeAnalyticReportCallback } from '@suite-native/trading-analytics';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import {
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
} from '@suite-native/trading-state';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { exhaustive } from '@trezor/type-utils';

import { clearExchangeFormQuoteData } from './useExchangeForm';
import { isFullySelectedReceiveAccount } from '../../utils/general/receiveAccountUtils';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.Trading,
    RootStackParamList
>;

export const useExchangeSelectQuote = (form: ExchangeFormType) => {
    const dispatch = useDispatch();
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
            navigation.navigate(RootStackRoutes.ReceiveAccounts, {
                symbol: selectedNetworkSymbol,
                tradingType: 'exchange',
            });
        }
    };

    const dispatchSelectQuote = async (
        analyticsAction: 'continue' | 'revoke',
        nextStep: (approvalStatus: ApprovalStatus) => void,
    ) => {
        if (!candidateQuote || isLoading || isCandidateQuotePrefetchBlocked) {
            return;
        }

        if (!isFullySelectedReceiveAccount(receiveAccount)) {
            selectReceiveAccount();
            analyticsReportCallback('account-selection', analyticsAction);

            return;
        }

        await dispatch(
            exchangeThunks.selectQuoteThunk({
                quote: { ...candidateQuote, swapSlippage },
                nextStep: () => {
                    clearExchangeFormQuoteData(form);
                    nextStep(getApprovalStatus(candidateQuote));
                },
            }),
        );
    };

    const selectQuote = () =>
        dispatchSelectQuote('continue', approvalStatus => {
            if (approvalStatus === 'approved' || approvalStatus === 'not_needed') {
                return navigation.navigate(RootStackRoutes.TradingExchangePreview, {});
            }

            dispatch(tradingExchangeActions.savePreselectedQuote(candidateQuote));

            switch (approvalStatus) {
                case 'needs_increase':
                    return navigation.navigate(RootStackRoutes.TradingExchangeApproval, {
                        shouldIncreaseLimit: true,
                    });

                case 'needs_revoke':
                    return navigation.navigate(RootStackRoutes.TradingExchangeRevoke, {
                        shouldIncreaseLimit: true,
                    });

                case 'needs_approval':
                    return navigation.navigate(RootStackRoutes.TradingExchangeApproval, {});

                case null:
                    // do nothing (should not happen when quote is defined)
                    return;

                default:
                    return exhaustive(approvalStatus);
            }
        });

    const selectQuoteForRevoke = () =>
        dispatchSelectQuote('revoke', approvalStatus => {
            switch (approvalStatus) {
                case 'not_needed':
                case 'needs_approval':
                case null:
                    return;

                case 'needs_increase':
                case 'needs_revoke':
                case 'approved':
                    dispatch(tradingExchangeActions.savePreselectedQuote(candidateQuote));

                    return navigation.navigate(RootStackRoutes.TradingExchangeRevoke, {
                        shouldIncreaseLimit: false,
                    });

                default:
                    return exhaustive(approvalStatus);
            }
        });

    return {
        canProceed,
        candidateQuote,
        sendAccount,
        receiveAccount,
        isLoading,
        selectReceiveAccount,
        selectQuote,
        selectQuoteForRevoke,
    };
};
