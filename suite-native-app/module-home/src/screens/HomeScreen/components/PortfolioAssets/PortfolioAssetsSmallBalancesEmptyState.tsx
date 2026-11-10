import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { Button, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';

import { PortfolioAssetsEmptyStateContainer } from './PortfolioAssetsEmptyStateContainer';

type PortfolioAssetsSmallBalancesEmptyStateProps = {
    onShowSmallBalancesPress: () => void;
};

export const PortfolioAssetsSmallBalancesEmptyState = ({
    onShowSmallBalancesPress,
}: PortfolioAssetsSmallBalancesEmptyStateProps) => {
    const { analytics } = useServices(injectNativeAnalytics);

    const showSmallBalances = () => {
        analytics.report({
            type: events.dashboardAssetListMenuEvent.name,
            payload: { type: 'show-small-balances', value: true },
        });
        onShowSmallBalancesPress();
    };

    return (
        <PortfolioAssetsEmptyStateContainer testID="@home/portfolio-assets/small-balances-empty-state">
            <Text variant="body-sm" color="contentSecondary" textAlign="center">
                <Translation id="moduleHome.assets.smallBalancesEmptyState.title" />
            </Text>
            <Button
                size="medium"
                priority="secondary"
                iconLeft="eye"
                onPress={showSmallBalances}
                testID="@home/portfolio-assets/small-balances-empty-state/show-button"
            >
                <Translation id="moduleHome.assets.viewOptionsSheet.showSmallBalances" />
            </Button>
        </PortfolioAssetsEmptyStateContainer>
    );
};
