import { useSelector } from 'react-redux';

import {
    selectHomeAssetsTableGrouping,
    setHomeAssetsTableGrouping,
} from '@suite-common/wallet-core';
import { type HomeAssetsTableGrouping } from '@suite-common/wallet-types';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { Box, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { typedObjectEntries } from '@trezor/utils';

import { PortfolioAssetsViewOptionsItem } from './PortfolioAssetsViewOptionsItem';

const GROUPING_LABELS: Record<HomeAssetsTableGrouping, TxKeyPath> = {
    default: 'moduleHome.assets.viewOptionsSheet.groupingDefault',
    networks: 'moduleHome.assets.viewOptionsSheet.groupingNetworks',
};

export const PortfolioAssetsGroupingOptions = () => {
    const selectedGrouping = useSelector(selectHomeAssetsTableGrouping);

    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);

    const chooseGrouping = (grouping: HomeAssetsTableGrouping) => {
        if (grouping !== selectedGrouping) {
            analytics.report({
                type: events.dashboardAssetListMenuEvent.name,
                payload: {
                    type: 'grouping',
                    value: grouping === 'networks' ? 'by-networks' : 'default',
                },
            });
        }
        dispatch(setHomeAssetsTableGrouping(grouping));
    };

    return (
        <>
            {typedObjectEntries(GROUPING_LABELS).map(([grouping, labelId]) => {
                const isSelected = grouping === selectedGrouping;

                return (
                    <PortfolioAssetsViewOptionsItem
                        key={grouping}
                        onPress={() => chooseGrouping(grouping)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        testID={`@home/portfolio-assets/view-options/grouping/${grouping}`}
                    >
                        <Box flex={1}>
                            <Text variant="body-sm">
                                <Translation id={labelId} />
                            </Text>
                        </Box>
                        {isSelected && <Icon name="check" size="mediumLarge" />}
                    </PortfolioAssetsViewOptionsItem>
                );
            })}
        </>
    );
};
