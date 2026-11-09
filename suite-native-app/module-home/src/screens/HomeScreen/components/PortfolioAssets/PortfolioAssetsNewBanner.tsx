import { useSelector } from 'react-redux';

import {
    closeHomeAssetTableNewBanner,
    selectIsHomeAssetTableNewBannerClosed,
} from '@suite-common/wallet-core';
import {
    CollapsibleBox,
    HStack,
    IconCircle,
    PressableOpacity,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const DISMISS_BUTTON_HIT_SLOP = 12;

const bannerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.elementFillBrandSofter,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.elementBorderBrandSofter,
    borderRadius: utils.borders.radii.r16,
    padding: utils.spacings.sp12,
}));

export const PortfolioAssetsNewBanner = () => {
    const isClosed = useSelector(selectIsHomeAssetTableNewBannerClosed);
    const { dispatch } = useServices(injectDispatch);
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    return (
        <CollapsibleBox
            isCollapsed={isClosed}
            paddingHorizontal="sp16"
            paddingBottom="sp12"
            testID="@home/portfolio-assets/new-banner"
        >
            <HStack spacing="sp12" alignItems="center" style={applyStyle(bannerStyle)}>
                <IconCircle name="lightning" intent="brand" size={32} />
                <VStack spacing="sp2" flex={1}>
                    <Text variant="body-sm-strong">
                        <Translation id="moduleHome.assets.newBanner.title" />
                    </Text>
                    <Text variant="body-xs" color="contentSecondary">
                        <Translation id="moduleHome.assets.newBanner.description" />
                    </Text>
                </VStack>
                <PressableOpacity
                    onPress={() => dispatch(closeHomeAssetTableNewBanner())}
                    hitSlop={DISMISS_BUTTON_HIT_SLOP}
                    accessibilityRole="button"
                    accessibilityLabel={translate('generic.buttons.dismiss')}
                    testID="@home/portfolio-assets/new-banner/dismiss"
                >
                    <Icon name="x" size="small" color="contentSecondary" />
                </PressableOpacity>
            </HStack>
        </CollapsibleBox>
    );
};
