import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type TradingRootState,
    type TradingTransactionStatus,
    type TradingType,
    isFinalStatus,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

import {
    tradingHistoryDetailEnteringTransition,
    tradingHistoryDetailExitingTransition,
} from '../../utils/tradingHistoryDetailAnimations';

type NavigationProp = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.TradingHistoryDetail
>;

type TradingHistoryDetailStatusActionProps = {
    providerName?: string;
    tradeType: TradingType;
    status: TradingTransactionStatus;
};

const StartNewTradeLabel = ({
    tradeType,
}: Pick<TradingHistoryDetailStatusActionProps, 'tradeType'>) => {
    switch (tradeType) {
        case 'buy':
            return <Translation id="moduleTrading.tradeHistory.detail.actionButton.startNew.buy" />;
        case 'sell':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.actionButton.startNew.sell" />
            );
        case 'exchange':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.actionButton.startNew.exchange" />
            );
        default:
            return exhaustive(tradeType);
    }
};

export const TradingHistoryDetailStatusAction = ({
    providerName,
    tradeType,
    status,
}: TradingHistoryDetailStatusActionProps) => {
    const navigation = useNavigation<NavigationProp>();
    const openLink = useOpenLink();
    const provider = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, providerName, tradeType),
    );
    const isSuccessStatus = status === 'SUCCESS';
    const isKYCStatus = status === 'KYC';
    const isFinalStatusAvailable = isFinalStatus(tradeType, status);
    const providerDisplayName = provider?.companyName ?? providerName;
    const supportUrl = provider?.supportUrl;

    if ((!isFinalStatusAvailable && !isKYCStatus) || (isKYCStatus && !supportUrl)) {
        return null;
    }

    const handlePress = () => {
        if (isKYCStatus) {
            if (!supportUrl) {
                return;
            }

            openLink(supportUrl);

            return;
        }

        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.TradeStack,
            params: {
                screen: TradingStackRoutes.Trading,
                params: { tradingType: tradeType },
            },
        });
    };

    const actionTestID = isKYCStatus ? 'contact-provider' : `start-new-trade`;

    return (
        <AnimatedBox
            entering={tradingHistoryDetailEnteringTransition}
            exiting={tradingHistoryDetailExitingTransition}
        >
            <Button
                onPress={handlePress}
                priority={isSuccessStatus ? 'primary' : 'secondary'}
                intent={isSuccessStatus ? 'brand' : 'neutral'}
                testID={`@trading-history/detail/action/${actionTestID}`}
            >
                {isKYCStatus ? (
                    <Translation
                        id="moduleTrading.tradeHistory.detail.actionButton.contactProvider"
                        values={{ providerName: providerDisplayName }}
                    />
                ) : (
                    <StartNewTradeLabel tradeType={tradeType} />
                )}
            </Button>
        </AnimatedBox>
    );
};
