import { BannerInline, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    Screen,
    ScreenHeader,
    type TradingStackRoutes,
} from '@suite-native/navigation';
import { type TradingStackScreenProps } from '@suite-native/trading-types';

import { ApprovalButton } from '../components/exchange/Approval/ApprovalButton';
import { ExchangeApprovalDetails } from '../components/exchange/Approval/ExchangeApprovalDetails';
import { useExchangeApprovalStep } from '../hooks/exchange/Approval/useExchangeApprovalStep';

type TradingExchangeApprovalScreenProps =
    TradingStackScreenProps<TradingStackRoutes.TradingExchangeApproval>;

export const TradingExchangeApprovalScreen = ({
    route: { params },
}: TradingExchangeApprovalScreenProps) => {
    const { shouldIncreaseLimit, isRevoked } = params;
    const { quote, coinSymbol, isApprovalReady, isDisabled, onApprovalTypeChange } =
        useExchangeApprovalStep({ isRevoked });

    if (!quote) {
        return (
            <Screen header={<ScreenHeader closeActionType="back" />}>
                <BannerInline
                    title={
                        <Translation id="moduleTrading.tradingExchangeApprovalScreen.approveErrorAlert" />
                    }
                    intent="critical"
                />
            </Screen>
        );
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
            footer={
                <ApprovalButton
                    isReady={isApprovalReady}
                    isDisabled={isDisabled}
                    flowType="approve"
                />
            }
        >
            <VStack spacing="sp12">
                {!!shouldIncreaseLimit && (
                    <BannerInline
                        intent="info"
                        title={
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.lowLimitInfoAlert" />
                        }
                    />
                )}

                {!!isRevoked && (
                    <BannerInline
                        intent="brand"
                        title={
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.revokeSuccessAlert" />
                        }
                    />
                )}

                <ExchangeApprovalDetails
                    exchange={quote.exchange}
                    onApprovalTypeChange={onApprovalTypeChange}
                />
            </VStack>
        </Screen>
    );
};
