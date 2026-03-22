import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    type TradingRootState,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeActiveQuote,
    tradingExchangeActions,
} from '@suite-common/trading';
import { InlineAlertBox, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    type RootStackParamList,
    Screen,
    type StackToStackCompositeScreenProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';

import { ApprovalButton } from '../components/exchange/Approval/ApprovalButton';
import { ExchangeApprovalDetails } from '../components/exchange/Approval/ExchangeApprovalDetails';
import { useApprovalFlow } from '../hooks/exchange/Approval/useApprovalFlow';
import { useEvmApprovalFees } from '../hooks/exchange/Approval/useEvmApprovalFees';

type TradingExchangeApprovalScreenProps = StackToStackCompositeScreenProps<
    TradingStackParamList,
    TradingStackRoutes.TradingExchangeApproval,
    RootStackParamList
>;

export const TradingExchangeApprovalScreen = ({
    route: { params },
}: TradingExchangeApprovalScreenProps) => {
    const { shouldIncreaseLimit, isRevoked } = params;
    const dispatch = useDispatch();

    const quote = useSelector(selectTradingExchangeActiveQuote);

    const { isConfirming, error: confirmError, confirmApproval } = useApprovalFlow();

    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    const { fee, isLoading: isComposingFees, error: feeError } = useEvmApprovalFees();

    const isLoading = isConfirming || isComposingFees;
    const error = confirmError || feeError;
    const isApprovalReady = !isLoading && !error && fee !== undefined;

    useEffect(
        () => {
            if (!quote) {
                console.error('No quote to confirm approval');

                return;
            }

            confirmApproval(quote);

            return () => {
                dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
            };
        },
        // We only want to confirm once on mount, not on every quote change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch],
    );

    if (!quote) {
        {
            // TODO 25971 would be better to render some alert
        }

        return null;
    }

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={
                        <Translation
                            id="moduleTrading.tradingExchangeApprovalScreen.approveTitle"
                            values={{ symbol: coinSymbol }}
                        />
                    }
                    subtitle={
                        <Translation
                            id="moduleTrading.tradingExchangeApprovalScreen.approveSubtitle"
                            values={{ symbol: coinSymbol }}
                        />
                    }
                    closeActionType="back"
                />
            }
        >
            <VStack spacing="sp12">
                {!!shouldIncreaseLimit && (
                    <InlineAlertBox
                        title={
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.lowLimitInfoAlert" />
                        }
                        variant="warning"
                    />
                )}

                {!!isRevoked && (
                    <InlineAlertBox
                        variant="success"
                        title={
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.revokeSuccessAlert" />
                        }
                    />
                )}

                <ExchangeApprovalDetails
                    fee={fee}
                    isLoading={isLoading}
                    exchange={quote.exchange}
                />
            </VStack>
            <ApprovalButton isReady={isApprovalReady} isDisabled={!!error} />
        </Screen>
    );
};
