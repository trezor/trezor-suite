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
    ScreenHeader,
    type StackToStackCompositeScreenProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';

import { ApprovalButton } from '../components/exchange/Approval/ApprovalButton';
import { ExchangeRevokeDetails } from '../components/exchange/Approval/ExchangeRevokeDetails';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';
import { useApprovalFlow } from '../hooks/exchange/Approval/useApprovalFlow';
import { useEvmApprovalFees } from '../hooks/exchange/Approval/useEvmApprovalFees';

type TradingExchangeRevokeScreenProps = StackToStackCompositeScreenProps<
    TradingStackParamList,
    TradingStackRoutes.TradingExchangeRevoke,
    RootStackParamList
>;

export const TradingExchangeRevokeScreen = ({
    route: { params },
}: TradingExchangeRevokeScreenProps) => {
    const { shouldIncreaseLimit } = params;
    const dispatch = useDispatch();

    const quote = useSelector(selectTradingExchangeActiveQuote);

    const { isConfirming, error: confirmError, confirmApproval } = useApprovalFlow();

    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    const { fee, isLoading: isComposingFees, error: feeError } = useEvmApprovalFees();

    const isLoading = isConfirming || isComposingFees;
    const error = confirmError || feeError;
    const isRevokeReady = !isLoading && !error && fee !== undefined;

    useEffect(
        () => {
            if (!quote) {
                console.error('No quote to revoke approval');

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
        return (
            <Screen header={<ScreenHeader closeActionType="back" />}>
                <InlineAlertBox
                    title={
                        <Translation id="moduleTrading.tradingExchangeRevokeScreen.revokeErrorAlert" />
                    }
                    variant="critical"
                />
            </Screen>
        );
    }

    return (
        <TradingDeviceConnectionGuard>
            <Screen
                header={
                    <DynamicScreenHeader
                        title={
                            <Translation
                                id="moduleTrading.tradingExchangeRevokeScreen.revokeTitle"
                                values={{ symbol: coinSymbol }}
                            />
                        }
                        subtitle={
                            shouldIncreaseLimit ? undefined : (
                                <Translation
                                    id="moduleTrading.tradingExchangeRevokeScreen.revokeSubtitle"
                                    values={{ symbol: coinSymbol }}
                                />
                            )
                        }
                        closeActionType="back"
                    />
                }
                footer={<ApprovalButton isReady={isRevokeReady} isDisabled={!!error} />}
            >
                <VStack spacing="sp12">
                    {!!shouldIncreaseLimit && (
                        <InlineAlertBox
                            variant="info"
                            title={
                                <Translation id="moduleTrading.tradingExchangeRevokeScreen.lowLimitInfoAlert" />
                            }
                        />
                    )}

                    <ExchangeRevokeDetails exchange={quote.exchange} />
                </VStack>
            </Screen>
        </TradingDeviceConnectionGuard>
    );
};
