import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    exchangeThunks,
    getApprovalStatus,
    parseCryptoId,
    selectTradingExchangeIsLoading,
    selectTradingMaxSlippagePercentage,
    tokenSupportsIncreasingAllowance,
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

    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const receiveAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const swapSlippage = useSelector(selectTradingMaxSlippagePercentage);

    const navigation = useNavigation<NavigationProps>();

    const [candidateQuote, receiveAsset] = form.watch(['quote', 'receiveAsset']);

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

                    dispatch(tradingExchangeActions.savePreselectedQuote(candidateQuote));

                    if (approvalStatus === 'needs_increase' && isIncreasingAllowanceSupported) {
                        return navigation.navigate(TradingStackRoutes.TradingExchangeApproval, {
                            shouldIncreaseLimit: true,
                        });
                    }

                    if (approvalStatus === 'needs_increase') {
                        return navigation.navigate(TradingStackRoutes.TradingExchangeRevoke, {
                            quote: candidateQuote,
                            shouldIncreaseLimit: true,
                        });
                    }

                    return navigation.navigate(TradingStackRoutes.TradingExchangeApproval, {});
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
