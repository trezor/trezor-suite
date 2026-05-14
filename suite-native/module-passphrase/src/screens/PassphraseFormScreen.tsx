import { useCallback } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-native/analytics';
import { Box, Button, HStack, Text, TitleHeader, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    type PassphraseStackParamList,
    PassphraseStackRoutes,
    type RootStackParamList,
    Screen,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import {
    PassphraseForm,
    PassphraseScreenHeader,
    useHandleUiRequestPassphraseOnDevice,
} from '@suite-native/passphrase';
import { useAnalytics } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';

const ANIMATION_DURATION = 300;

const cardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.legacyBackgroundAlertBlueSubtleOnElevation1,
    borderRadius: utils.borders.radii.r16,
    borderColor: utils.colors.legacyBackgroundAlertBlueSubtleOnElevationNegative,
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

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const PassphraseFormScreen = () => {
    const { applyStyle } = useNativeStyles();
    const analytics = useAnalytics();
    const { translate } = useTranslate();

    const navigation = useNavigation<NavigationProp>();

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

    const handleAfterSubmit = () => {
        navigation.navigate(PassphraseStackRoutes.PassphraseConfirmOnTrezor);
    };

    const handleAnimation = () => (cardHeight.value = 0);

    const handleOpenLink = () => {
        analytics.report({ type: events.passphraseArticleOpenedEvent.name });
        openLink(HELP_CENTER_PASSPHRASE_URL);
    };

    const setWarningHeight = (height: number) => {
        'worklet';

        if (cardHeight.value === undefined) {
            cardHeight.value = height;
        }
    };

    const navigateToEnterOnDevice = useCallback(() => {
        navigation.navigate(PassphraseStackRoutes.PassphraseEnterOnTrezor);
    }, [navigation]);

    useHandleUiRequestPassphraseOnDevice(navigateToEnterOnDevice);

    return (
        <Screen header={<PassphraseScreenHeader />}>
            <VStack marginTop="sp8" spacing="sp16">
                <TitleHeader
                    title={<Translation id="modulePassphrase.title" />}
                    subtitle={
                        <Translation
                            id="modulePassphrase.subtitle"
                            values={{
                                bold: chunks => <Text variant="body-md-strong">{chunks}</Text>,
                            }}
                        />
                    }
                    titleVariant="headline-md"
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
                                                color="contentInfo"
                                                size="medium"
                                            />
                                        </View>
                                        <Text
                                            color="contentInfo"
                                            variant="body-sm-strong"
                                            style={applyStyle(cardTextStyle)}
                                        >
                                            <Translation id="modulePassphrase.alertCard.paragraphWarning1" />
                                        </Text>
                                    </HStack>
                                    <HStack>
                                        <View style={applyStyle(warningIconWrapperStyle)}>
                                            <Icon
                                                name="eyeSlash"
                                                color="contentPrimary"
                                                size="medium"
                                            />
                                        </View>
                                        <Text
                                            color="contentPrimary"
                                            variant="body-sm"
                                            style={applyStyle(cardTextStyle)}
                                        >
                                            <Translation id="modulePassphrase.alertCard.paragraphWarning2" />
                                        </Text>
                                    </HStack>
                                    <HStack>
                                        <View style={applyStyle(warningIconWrapperStyle)}>
                                            <Icon
                                                name="warning"
                                                color="contentPrimary"
                                                size="medium"
                                            />
                                        </View>
                                        <Text
                                            color="contentPrimary"
                                            variant="body-sm"
                                            style={applyStyle(cardTextStyle)}
                                        >
                                            <Translation id="modulePassphrase.alertCard.paragraphWarning3" />
                                        </Text>
                                    </HStack>
                                </VStack>
                                <Button
                                    size="medium"
                                    intent="info"
                                    priority="primary"
                                    iconLeft="arrowLineUpRight"
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
                    onAfterSubmit={handleAfterSubmit}
                />
            </VStack>
        </Screen>
    );
};
