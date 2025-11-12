import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    TradingRootState,
    selectTradingCoinSymbolByCryptoId,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Box, Button, InlineAlertBox, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    RootStackParamList,
    Screen,
    StackNavigationProps,
    StackToStackCompositeScreenProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';

import { ExchangeApprovalDetailsCard } from '../components/exchange/Approval/ExchangeApprovalDetailsCard';
import { ExchangeApprovalForCard } from '../components/exchange/Approval/ExchangeApprovalForCard';
import { useExchangeFlow } from '../hooks/exchange/useExchangeFlow';

type TradingExchangeApprovalScreenProps = StackToStackCompositeScreenProps<
    TradingStackParamList,
    TradingStackRoutes.TradingExchangeApproval,
    RootStackParamList
>;

export const TradingExchangeApprovalScreen = ({
    route: { params },
}: TradingExchangeApprovalScreenProps) => {
    const { quote, shouldIncreaseLimit, isRevoked } = params;
    const navigation =
        useNavigation<
            StackNavigationProps<TradingStackParamList, TradingStackRoutes.TradingExchangeApproval>
        >();

    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, quote.exchange, 'exchange'),
    );

    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    const { confirmTrade } = useExchangeFlow();

    const handleContinue = async () => {
        const updatedQuote = {
            ...quote,
            // approvalType: selectedApprovalType, // TODO 22293
        };

        const success = await confirmTrade({
            receiveAddress: quote.receiveAddress ?? '',
            trade: updatedQuote,
            approvalFlow: true,
            nextStep: () => {},
        });

        if (success) {
            // TODO
            navigation.navigate(TradingStackRoutes.TradingExchangePreview, { isApproved: true });
        }
    };

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
                <ExchangeApprovalDetailsCard quote={quote} />
            </VStack>

            <Box paddingTop="sp20">
                <Button onPress={handleContinue}>
                    <Translation id="generic.buttons.continue" />
                </Button>
            </Box>
        </Screen>
    );
};
