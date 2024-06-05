import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { View } from 'react-native';

import { useOpenLink } from '@suite-native/link';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons';

import { PassphraseForm } from '../components/PassphraseForm';
import { PassphraseContentScreenWrapper } from '../components/PassphraseContentScreenWrapper';

const ANIMATION_DURATION = 300;
const ALERT_CARD_HEIGHT = 204;

const cardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundAlertBlueSubtleOnElevation1,
    borderRadius: utils.borders.radii.medium,
    borderColor: utils.colors.backgroundAlertBlueSubtleOnElevationNegative,
    borderWidth: utils.borders.widths.small,
    padding: 12,
    flex: 1,
    justifyContent: 'center',
}));

const cardTextStyle = prepareNativeStyle(_ => ({
    width: '90%',
}));

const animationWrapperStyle = prepareNativeStyle(() => ({
    overflow: 'hidden',
}));

export const PassphraseFormScreen = () => {
    const { applyStyle } = useNativeStyles();

    const { translate } = useTranslate();

    const openLink = useOpenLink();

    const cardHeight = useSharedValue(ALERT_CARD_HEIGHT);

    const animationStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(cardHeight.value, { duration: ANIMATION_DURATION }),
        };
    });

    const handleAnimation = () => (cardHeight.value = 0);

    const handleOpenLink = () => {
        openLink('https://trezor.io/learn/a/passphrases-and-hidden-wallets');
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
            <VStack spacing="medium">
                <View style={applyStyle(animationWrapperStyle)}>
                    <Animated.View style={animationStyle}>
                        <Box style={applyStyle(cardStyle)}>
                            <VStack spacing="medium">
                                <VStack>
                                    <HStack alignItems="flex-start">
                                        <Icon
                                            name="warningCircle"
                                            color="textAlertBlue"
                                            size="medium"
                                        />
                                        <Text
                                            color="textAlertBlue"
                                            variant="callout"
                                            style={applyStyle(cardTextStyle)}
                                        >
                                            <Translation id="modulePassphrase.alertCard.paragraphWarning1" />
                                        </Text>
                                    </HStack>
                                    <HStack>
                                        <Icon
                                            name="eyeSlashLight"
                                            color="textDefault"
                                            size="medium"
                                        />
                                        <Text
                                            color="textDefault"
                                            variant="hint"
                                            style={applyStyle(cardTextStyle)}
                                        >
                                            <Translation id="modulePassphrase.alertCard.paragraphWarning2" />
                                        </Text>
                                    </HStack>
                                    <HStack>
                                        <Icon
                                            name="warningTriangle"
                                            color="textDefault"
                                            size="medium"
                                        />
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
