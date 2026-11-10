import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Button, CenteredTitleHeader, HStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { selectIsTradingBuyEnabled, selectIsTradingEnabled } from '@suite-native/trading-state';

import { PortfolioAssetsEmptyStateContainer } from './PortfolioAssetsEmptyStateContainer';
import { AssetsGetSvg } from '../../../../assets/AssetsGetSvg';
import { useReceiveNavigation } from '../../useReceiveNavigation';

const ILLUSTRATION_SIZE = 120;

export const PortfolioAssetsEmptyState = () => {
    const { isReceiveAvailable, navigateToReceive } = useReceiveNavigation();
    const isTradingEnabled = useSelector(selectIsTradingEnabled);
    const isTradingBuyEnabled = useSelector(selectIsTradingBuyEnabled);
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const navigateToBuy = () => {
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.Trading,
            params: { tradingType: 'buy' },
        });
    };

    const isBuyVisible = isTradingEnabled && isTradingBuyEnabled;

    return (
        <PortfolioAssetsEmptyStateContainer testID="@home/portfolio-assets/empty-state">
            <AssetsGetSvg width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} />
            <CenteredTitleHeader
                title={<Translation id="moduleHome.assets.emptyState.title" />}
                subtitle={<Translation id="moduleHome.assets.emptyState.subtitle" />}
                subtitleVariant="body-sm"
            />
            <HStack spacing="sp12">
                {isReceiveAvailable && (
                    <Button
                        size="medium"
                        iconLeft="arrowDown"
                        onPress={navigateToReceive}
                        testID="@home/portfolio-assets/empty-state/receive-button"
                    >
                        <Translation id="moduleHome.buttons.receive" />
                    </Button>
                )}
                {isBuyVisible && (
                    <Button
                        size="medium"
                        priority="secondary"
                        iconLeft="plus"
                        onPress={navigateToBuy}
                        testID="@home/portfolio-assets/empty-state/buy-button"
                    >
                        <Translation id="moduleHome.buttons.buy" />
                    </Button>
                )}
            </HStack>
        </PortfolioAssetsEmptyStateContainer>
    );
};
