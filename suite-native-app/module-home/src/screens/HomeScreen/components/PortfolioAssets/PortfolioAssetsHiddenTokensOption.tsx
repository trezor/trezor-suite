import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { selectIsAssetListLoading } from '@suite-native/assets';
import { Box, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    AssetsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

import { PortfolioAssetsSpinner } from './PortfolioAssetsSpinner';
import { PortfolioAssetsViewOptionsItem } from './PortfolioAssetsViewOptionsItem';

type PortfolioAssetsHiddenTokensOptionProps = {
    hiddenTokenCount: number;
    onPress: () => void;
};

export const PortfolioAssetsHiddenTokensOption = ({
    hiddenTokenCount,
    onPress,
}: PortfolioAssetsHiddenTokensOptionProps) => {
    const isAssetListLoading = useSelector(selectIsAssetListLoading);
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>>();
    const { analytics } = useServices(injectNativeAnalytics);

    const openHiddenTokens = () => {
        analytics.report({
            type: events.navigateFlowEvent.name,
            payload: { action: 'navigate', type: 'hidden-tokens', from: 'dashboard' },
        });
        onPress();
        navigation.navigate(RootStackRoutes.AssetsStack, {
            screen: AssetsStackRoutes.HiddenTokens,
        });
    };

    return (
        <PortfolioAssetsViewOptionsItem
            onPress={openHiddenTokens}
            accessibilityRole="button"
            testID="@home/portfolio-assets/view-options/hidden-tokens"
        >
            <Box flex={1}>
                <Text variant="body-sm">
                    <Translation id="moduleHome.assets.viewOptionsSheet.hiddenTokens" />
                </Text>
            </Box>
            {isAssetListLoading ? (
                <PortfolioAssetsSpinner />
            ) : (
                <Text variant="body-sm" color="contentSecondary">
                    {hiddenTokenCount}
                </Text>
            )}
            <Icon name="caretRight" color="contentSecondary" size="mediumLarge" />
        </PortfolioAssetsViewOptionsItem>
    );
};
