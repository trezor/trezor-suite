import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    TradingRootState,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangePreselectedQuote,
    selectTradingProviderByNameAndTradeType,
    tradingExchangeActions,
} from '@suite-common/trading';
import { InlineAlertBox, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    RootStackParamList,
    Screen,
    StackToStackCompositeScreenProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';

import { ApprovalButton } from '../components/exchange/Approval/ApprovalButton';
import { ExchangeApprovalDetailsCard } from '../components/exchange/Approval/ExchangeApprovalDetailsCard';
import { ExchangeApprovalForCard } from '../components/exchange/Approval/ExchangeApprovalForCard';

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

    const quote = useSelector(selectTradingExchangePreselectedQuote);

    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, quote?.exchange, 'exchange'),
    );

    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    useEffect(
        () => () => {
            dispatch(tradingExchangeActions.savePreselectedQuote(undefined));
        },
        [dispatch],
    );

    if (!quote) {
        return null;
    }

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={
                        <Translation
                            id="moduleTrading.tradingExchangeApprovalScreen.title"
                            values={{ symbol: coinSymbol }}
                        />
                    }
                    subtitle={
                        <Translation
                            id="moduleTrading.tradingExchangeApprovalScreen.subtitle"
                            values={{ symbol: coinSymbol, companyName: providerInfo?.companyName }}
                        />
                    }
                    closeActionType="back"
                />
            }
        >
            <VStack spacing="sp16">
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

                <ExchangeApprovalForCard />
                <ExchangeApprovalDetailsCard />
            </VStack>
            <ApprovalButton />
        </Screen>
    );
};
