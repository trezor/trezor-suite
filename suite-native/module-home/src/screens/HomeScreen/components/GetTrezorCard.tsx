import { useDispatch } from 'react-redux';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Box, Card, HStack, PressableOpacity, Text, TextButton, VStack } from '@suite-native/atoms';
import { setIsGetTrezorBannerClosed } from '@suite-native/banner-flags';
import { TwoSidedTS7Image } from '@suite-native/device';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useGetTrezorEshopCta } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const CONTAINER_SIZE = 80;
const IMAGE_SIZE = 53;

const compactImageContainerStyle = prepareNativeStyle(utils => ({
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    borderRadius: utils.borders.radii.r12,
    backgroundColor: utils.colors.surfaceFillModelessBrand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
}));

const cardContentStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp4,
}));

export const GetTrezorCard = () => {
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();

    const { analytics } = useServices(selectNativeAnalyticsDep);
    const handleGetTrezor = useGetTrezorEshopCta('dashboard');

    const handleClose = () => {
        analytics.report({
            type: events.promoNoDeviceEshopCtaEvent.name,
            payload: { origin: 'dashboard', platform: 'mobile', action: 'close' },
        });
        dispatch(setIsGetTrezorBannerClosed());
    };

    return (
        <Card noPadding>
            <HStack
                style={applyStyle(cardContentStyle)}
                spacing="sp12"
                paddingRight="sp16"
                alignItems="center"
                justifyContent="space-between"
            >
                <Box style={applyStyle(compactImageContainerStyle)}>
                    <TwoSidedTS7Image size={IMAGE_SIZE} />
                </Box>
                <VStack flex={1} spacing="sp2">
                    <Text variant="body-md-strong">
                        <Translation id="moduleHome.emptyState.getTrezorCta.title" />
                    </Text>
                    <HStack>
                        <TextButton
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            iconRight="arrowLineUpRight"
                            isUnderlined
                            onPress={handleGetTrezor}
                            testID="@home/get-trezor-cta/link"
                        >
                            <Translation id="moduleHome.emptyState.getTrezorCta.button" />
                        </TextButton>
                    </HStack>
                </VStack>
                <PressableOpacity
                    onPress={handleClose}
                    testID="@home/get-trezor-cta/close"
                    hitSlop={10}
                >
                    <Icon name="x" size="mediumLarge" color="contentNeutral" />
                </PressableOpacity>
            </HStack>
        </Card>
    );
};
