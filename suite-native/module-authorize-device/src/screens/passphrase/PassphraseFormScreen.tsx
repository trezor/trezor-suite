import { LayoutChangeEvent, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EventType, analytics } from '@suite-native/analytics';
import { Box, Button, HStack, Text, TitleHeader, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { Screen } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { PassphraseForm } from '../../components/passphrase/PassphraseForm';
import { PassphraseScreenHeader } from '../../components/passphrase/PassphraseScreenHeader';

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
        <Screen header={<PassphraseScreenHeader />}>
            <VStack marginTop="sp8" spacing="sp16">
                <TitleHeader
                    title={<Translation id="modulePassphrase.title" />}
                    subtitle={
                        <Translation
                            id="modulePassphrase.subtitle"
                            values={{
                                bold: chunks => <Text variant="highlight">{chunks}</Text>,
                            }}
                        />
                    }
                    titleVariant="titleMedium"
                />
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
                                                name="warning"
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
                                                name="eyeSlash"
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
                                                name="warning"
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
        </Screen>
    );
};
