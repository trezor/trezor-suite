import { Box, Button, Card, Divider, HStack, Text, VStack } from '@suite-native/atoms';
import { TwoSidedTS7Image } from '@suite-native/device';
import { Icon, type IconName } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { useGetTrezorEshopCta } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const FULL_CONTAINER_HEIGHT = 190;
const FULL_IMAGE_SIZE = 170;

const fullImageContainerStyle = prepareNativeStyle(utils => ({
    width: '100%',
    height: FULL_CONTAINER_HEIGHT,
    borderTopLeftRadius: utils.borders.radii.r8,
    borderTopRightRadius: utils.borders.radii.r8,
    backgroundColor: utils.colors.surfaceFillModelessBrand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
}));

const bulletPointValues: Array<{ icon: IconName; textId: TxKeyPath }> = [
    { icon: 'shieldStarFilled', textId: 'moduleSettings.getTrezorCta.bullets.security' },
    { icon: 'devicesFilled', textId: 'moduleSettings.getTrezorCta.bullets.app' },
    { icon: 'rocketLaunchFilled', textId: 'moduleSettings.getTrezorCta.bullets.setup' },
];

export const GetTrezorCard = () => {
    const { applyStyle } = useNativeStyles();
    const handleGetTrezor = useGetTrezorEshopCta('settings');

    return (
        <Card>
            <VStack spacing="sp8">
                <Box style={applyStyle(fullImageContainerStyle)}>
                    <TwoSidedTS7Image size={FULL_IMAGE_SIZE} />
                </Box>
                <VStack spacing="sp16">
                    <VStack spacing="sp12">
                        <VStack spacing={0}>
                            <Text variant="headline-sm">
                                <Translation id="moduleSettings.getTrezorCta.title" />
                            </Text>
                            <Text variant="body-sm" color="contentSecondary">
                                <Translation id="moduleSettings.getTrezorCta.subtitle" />
                            </Text>
                        </VStack>
                        <Divider />
                        <VStack spacing="sp10">
                            {bulletPointValues.map(({ icon, textId }) => (
                                <HStack key={icon} spacing="sp8" alignItems="center">
                                    <Icon name={icon} size="medium" color="contentNeutral" />
                                    <Text variant="body-xs" color="contentSecondary">
                                        <Translation id={textId} />
                                    </Text>
                                </HStack>
                            ))}
                        </VStack>
                    </VStack>
                    <Button
                        intent="neutral"
                        priority="primary"
                        iconRight="arrowLineUpRight"
                        size="medium"
                        isFullWidth
                        onPress={handleGetTrezor}
                        testID="@settings/get-trezor-cta/button"
                    >
                        <Translation id="moduleSettings.getTrezorCta.button" />
                    </Button>
                </VStack>
            </VStack>
        </Card>
    );
};
