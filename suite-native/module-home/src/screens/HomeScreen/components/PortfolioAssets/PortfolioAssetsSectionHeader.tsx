import { useSelector } from 'react-redux';

import { selectIsHomeAssetTableMenuAvailable } from '@suite-common/assets';
import { selectHomeAssetsTableGrouping } from '@suite-common/wallet-core';
import { HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';

const VIEW_OPTIONS_BUTTON_HIT_SLOP = 12;

type PortfolioAssetsSectionHeaderProps = {
    onViewOptionsPress: () => void;
};

export const PortfolioAssetsSectionHeader = ({
    onViewOptionsPress,
}: PortfolioAssetsSectionHeaderProps) => {
    const grouping = useSelector(selectHomeAssetsTableGrouping);
    const isMenuAvailable = useSelector(selectIsHomeAssetTableMenuAvailable);

    const { translate } = useTranslate();

    return (
        <HStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="sp20"
            paddingTop="sp24"
            paddingBottom="sp12"
        >
            <Text variant="body-xs" color="contentSecondary">
                <Translation id="moduleHome.assets.title" />
            </Text>
            {isMenuAvailable && (
                <PressableOpacity
                    onPress={onViewOptionsPress}
                    hitSlop={VIEW_OPTIONS_BUTTON_HIT_SLOP}
                    accessibilityRole="button"
                    accessibilityLabel={translate('moduleHome.assets.viewOptionsSheet.title')}
                    testID="@home/portfolio-assets/view-options-button"
                >
                    <Icon
                        name="funnelSimple"
                        size="mediumLarge"
                        color={grouping !== 'default' ? 'contentInfo' : 'contentPrimary'}
                    />
                </PressableOpacity>
            )}
        </HStack>
    );
};
