import { useSelector } from 'react-redux';

import {
    selectHomeAssetsTableGrouping,
    setHomeAssetsTableGrouping,
} from '@suite-common/wallet-core';
import { type HomeAssetsTableGrouping } from '@suite-common/wallet-types';
import { Box, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { typedObjectEntries } from '@trezor/utils';

const GROUPING_LABELS: Record<HomeAssetsTableGrouping, TxKeyPath> = {
    default: 'moduleHome.assets.viewOptionsSheet.groupingDefault',
    networks: 'moduleHome.assets.viewOptionsSheet.groupingNetworks',
};

export const PortfolioAssetsGroupingOptions = () => {
    const selectedGrouping = useSelector(selectHomeAssetsTableGrouping);

    const { dispatch } = useServices(injectDispatch);

    return (
        <VStack spacing={0}>
            {typedObjectEntries(GROUPING_LABELS).map(([grouping, labelId]) => {
                const isSelected = grouping === selectedGrouping;

                return (
                    <PressableOpacity
                        key={grouping}
                        onPress={() => dispatch(setHomeAssetsTableGrouping(grouping))}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        testID={`@home/portfolio-assets/view-options/grouping/${grouping}`}
                    >
                        <HStack
                            alignItems="center"
                            spacing="sp12"
                            paddingHorizontal="sp4"
                            paddingVertical="sp12"
                        >
                            <Box flex={1}>
                                <Text variant="body-sm">
                                    <Translation id={labelId} />
                                </Text>
                            </Box>
                            {isSelected && <Icon name="check" size="mediumLarge" />}
                        </HStack>
                    </PressableOpacity>
                );
            })}
        </VStack>
    );
};
