import React, { useEffect } from 'react';
import { Modal, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Button, Text, Card, VStack, useBottomSheetAnimation } from '@suite-native/atoms';

import { useShakeAnimation } from '../useShakeAnimation';
import { Alert } from '../alertsAtoms';
import { useAlert } from '../useAlert';

type AlertSheetProps = {
    alert: Alert;
};

const alertSheetContainerStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: utils.spacings.extraLarge,
    paddingHorizontal: utils.spacings.large,
    marginBottom: utils.spacings.extraLarge,
    marginHorizontal: utils.spacings.small,
    borderRadius: utils.borders.radii.medium,
    ...utils.boxShadows.small,
}));

const alertSheetContentStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

const shakeTriggerStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'flex-end',
}));

const sheetOverlayStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

export const AlertSheet = ({ alert }: AlertSheetProps) => {
    const { hideAlert } = useAlert();
    const { applyStyle } = useNativeStyles();
    const { runShakeAnimation, shakeAnimatedStyle } = useShakeAnimation();

    const {
        animatedSheetWithOverlayStyle,
        animatedSheetWrapperStyle,
        closeSheetAnimated,
        openSheetAnimated,
    } = useBottomSheetAnimation({ onClose: hideAlert, isVisible: true });

    useEffect(() => {
        openSheetAnimated();
    }, [openSheetAnimated]);

    const {
        title,
        description,
        onPressPrimaryButton,
        primaryButtonTitle,
        onPressSecondaryButton,
        secondaryButtonTitle,
    } = alert;

    const handlePressPrimaryButton = async () => {
        await closeSheetAnimated();
        onPressPrimaryButton();
    };

    const handlePressSecondaryButton = async () => {
        await closeSheetAnimated();
        onPressSecondaryButton?.();
    };

    return (
        <Modal transparent visible={!!alert}>
            <Animated.View style={[animatedSheetWithOverlayStyle, applyStyle(sheetOverlayStyle)]}>
                <Pressable onPress={runShakeAnimation} style={applyStyle(shakeTriggerStyle)}>
                    <Animated.View
                        style={[animatedSheetWrapperStyle, shakeAnimatedStyle]}
                        onStartShouldSetResponder={_ => true} // Stop the shake event trigger propagation.
                    >
                        <Card style={applyStyle(alertSheetContainerStyle)}>
                            <VStack style={applyStyle(alertSheetContentStyle)} spacing="large">
                                <VStack alignItems="center" spacing="small">
                                    <Text variant="titleSmall">{title}</Text>
                                    <Text color="textSubdued" align="center">
                                        {description}
                                    </Text>
                                </VStack>
                                <VStack spacing="medium">
                                    <Button
                                        colorScheme="primary"
                                        onPress={handlePressPrimaryButton}
                                    >
                                        {primaryButtonTitle}
                                    </Button>
                                    {secondaryButtonTitle && (
                                        <Button
                                            colorScheme="tertiaryElevation1"
                                            onPress={handlePressSecondaryButton}
                                        >
                                            {secondaryButtonTitle}
                                        </Button>
                                    )}
                                </VStack>
                            </VStack>
                        </Card>
                    </Animated.View>
                </Pressable>
            </Animated.View>
        </Modal>
    );
};
