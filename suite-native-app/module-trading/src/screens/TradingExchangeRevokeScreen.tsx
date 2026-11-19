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
import { ExchangeRevokeDetails } from '../components/exchange/Approval/ExchangeRevokeDetails';
import { useExchangeRevokeStep } from '../hooks/exchange/Approval/useExchangeRevokeStep';

type TradingExchangeRevokeScreenProps =
    TradingStackScreenProps<TradingStackRoutes.TradingExchangeRevoke>;

export const TradingExchangeRevokeScreen = ({
    route: { params },
}: TradingExchangeRevokeScreenProps) => {
    const { shouldIncreaseLimit } = params;
    const { quote, coinSymbol, isRevokeReady, isDisabled } = useExchangeRevokeStep();

    if (!quote) {
        return (
            <Screen header={<ScreenHeader closeActionType="back" />}>
                <BannerInline
                    title={
                        <Translation id="moduleTrading.tradingExchangeRevokeScreen.revokeErrorAlert" />
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
            footer={
                <ApprovalButton
                    isReady={isRevokeReady}
                    isDisabled={isDisabled}
                    flowType={shouldIncreaseLimit ? 'revoke-and-approve' : 'revoke'}
                />
            }
        >
            <VStack spacing="sp12">
                {!!shouldIncreaseLimit && (
                    <BannerInline
                        intent="info"
                        title={
                            <Translation id="moduleTrading.tradingExchangeRevokeScreen.lowLimitInfoAlert" />
                        }
                    />
                )}

                <ExchangeRevokeDetails exchange={quote.exchange} />
            </VStack>
        </Screen>
    );
};
