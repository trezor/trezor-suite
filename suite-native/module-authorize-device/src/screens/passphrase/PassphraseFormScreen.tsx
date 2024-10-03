import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LayoutChangeEvent, View } from 'react-native';

import { useOpenLink } from '@suite-native/link';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons-deprecated';
import { EventType, analytics } from '@suite-native/analytics';

import { PassphraseForm } from '../../components/passphrase/PassphraseForm';
import { PassphraseContentScreenWrapper } from '../../components/passphrase/PassphraseContentScreenWrapper';

const ANIMATION_DURATION = 300;

const cardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundAlertBlueSubtleOnElevation1,
    borderRadius: utils.borders.radii.r16,
    borderColor: utils.colors.backgroundAlertBlueSubtleOnElevationNegative,
    borderWidth: utils.borders.widths.small,
    padding: utils.spacings.sp16,
    flex: 1,
    justifyContent: 'center',
}));

const cardTextStyle = prepareNativeStyle(_ => ({
    width: '90%',
}));

const warningIconWrapperStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp2,
}));

const animationWrapperStyle = prepareNativeStyle(() => ({
    overflow: 'hidden',
}));

export const PassphraseFormScreen = () => {
    const { applyStyle } = useNativeStyles();

    const { translate } = useTranslate();

    const openLink = useOpenLink();

    const cardHeight = useSharedValue<number | undefined>(undefined);

    const animationStyle = useAnimatedStyle(() => {
        if (cardHeight.value === undefined) {
            return {};
        }

        return {
            height: withTiming(cardHeight.value, { duration: ANIMATION_DURATION }),
        };
    });

    const handleAnimation = () => (cardHeight.value = 0);

    const handleOpenLink = () => {
        analytics.report({ type: EventType.PassphraseArticleOpened });
        openLink('https://trezor.io/learn/a/passphrases-and-hidden-wallets');
    };

    const setWarningHeight = (height: number) => {
        'worklet';

        if (cardHeight.value === undefined) {
            cardHeight.value = height;
        }
    };

    return (
        <PassphraseContentScreenWrapper
            title={<Translation id="modulePassphrase.title" />}
            subtitle={
                <Translation
                    id="modulePassphrase.subtitle"
                    values={{
                        bold: chunks => <Text variant="highlight">{chunks}</Text>,
                    }}
                />
            }
        >
            <VStack spacing="sp16">
                <View
                    style={applyStyle(animationWrapperStyle)}
                    onLayout={(event: LayoutChangeEvent) =>
                        setWarningHeight(event.nativeEvent.layout.height)
                    }
                >
                    <Animated.View style={animationStyle}>
                        <Box style={applyStyle(cardStyle)}>
                            <VStack spacing="sp16">
                                <VStack spacing="sp12">
                                    <HStack>
                                        <View style={applyStyle(warningIconWrapperStyle)}>
                                            <Icon
                                                name="warningCircle"
                                                color="textAlertBlue"
                                                size="medium"
                                            />
                                        </View>
                                        <Text
                                            color="textAlertBlue"
                                            variant="callout"
                                            style={applyStyle(cardTextStyle)}
                                        >
                                            <Translation id="modulePassphrase.alertCard.paragraphWarning1" />
                                        </Text>
                                    </HStack>
                                    <HStack>
                                        <View style={applyStyle(warningIconWrapperStyle)}>
                                            <Icon
                                                name="eyeSlashLight"
                                                color="textDefault"
                                                size="medium"
                                            />
                                        </View>
                                        <Text
                                            color="textDefault"
                                            variant="hint"
                                            style={applyStyle(cardTextStyle)}
                                        >
                                            <Translation id="modulePassphrase.alertCard.paragraphWarning2" />
                                        </Text>
                                    </HStack>
                                    <HStack>
                                        <View style={applyStyle(warningIconWrapperStyle)}>
                                            <Icon
                                                name="warningTriangle"
                                                color="textDefault"
                                                size="medium"
                                            />
                                        </View>
                                        <Text
                                            color="textDefault"
                                            variant="hint"
                                            style={applyStyle(cardTextStyle)}
                                        >
                                            <Translation id="modulePassphrase.alertCard.paragraphWarning3" />
                                        </Text>
                                    </HStack>
                                </VStack>
                                <Button
                                    size="small"
                                    colorScheme="blueBold"
                                    viewLeft="arrowLineUpRight"
                                    onPress={handleOpenLink}
                                >
                                    <Translation id="modulePassphrase.alertCard.button" />
                                </Button>
                            </VStack>
                        </Box>
                    </Animated.View>
                </View>
                <PassphraseForm
                    onFocus={handleAnimation}
                    inputLabel={translate('modulePassphrase.form.createWalletInputLabel')}
                />
            </VStack>
        </PassphraseContentScreenWrapper>
    );
};
