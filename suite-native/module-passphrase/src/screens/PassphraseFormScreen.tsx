import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { View } from 'react-native';

import { Screen } from '@suite-native/navigation';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons';

import { PassphraseForm } from '../components/PassphraseForm';
import { PassphraseScreenHeader } from '../components/PassphraseScreenHeader';

const ANIMATION_DURATION = 300;
const ALERT_CARD_HEIGHT = 148;

const cardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundAlertBlueSubtleOnElevation1,
    borderRadius: utils.borders.radii.medium,
    padding: 12,
    flex: 1,
    justifyContent: 'center',
}));

const animationWrapperStyle = prepareNativeStyle(() => ({
    overflow: 'hidden',
}));

export const PassphraseFormScreen = () => {
    const { applyStyle, utils } = useNativeStyles();

    const cardHeight = useSharedValue(ALERT_CARD_HEIGHT);

    const animationStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(cardHeight.value, { duration: ANIMATION_DURATION }),
        };
    });

    const handleAnimation = () => (cardHeight.value = 0);

    return (
        <Screen
            screenHeader={<PassphraseScreenHeader />}
            customHorizontalPadding={utils.spacings.medium}
        >
            <VStack spacing="large">
                <VStack>
                    <Text variant="titleSmall">
                        <Translation id="modulePassphrase.title" />
                    </Text>
                    <Text>
                        <Translation
                            id="modulePassphrase.subtitle"
                            values={{
                                bold: chunks => <Text variant="highlight">{chunks}</Text>,
                            }}
                        />
                    </Text>
                </VStack>
                <VStack spacing="medium">
                    <View style={applyStyle(animationWrapperStyle)}>
                        <Animated.View style={animationStyle}>
                            <Box style={applyStyle(cardStyle)}>
                                <VStack>
                                    <HStack>
                                        <Icon
                                            name="warningCircle"
                                            color="textAlertBlue"
                                            size="medium"
                                        />
                                        <Text color="textAlertBlue" variant="callout">
                                            <Translation id="modulePassphrase.alertCard.paragraphWarning1" />
                                        </Text>
                                    </HStack>
                                    <HStack>
                                        <Icon
                                            name="warningTriangle"
                                            color="textDefault"
                                            size="medium"
                                        />
                                        <Text color="textDefault" variant="hint">
                                            <Translation id="modulePassphrase.alertCard.paragraphWarning2" />
                                        </Text>
                                    </HStack>
                                    <Button size="small">
                                        <Translation id="modulePassphrase.alertCard.button" />
                                    </Button>
                                </VStack>
                            </Box>
                        </Animated.View>
                    </View>
                    <PassphraseForm onFocus={handleAnimation} />
                </VStack>
            </VStack>
        </Screen>
    );
};
