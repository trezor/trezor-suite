import React, { useEffect } from 'react';
import { Modal, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { RequireAllOrNone } from 'type-fest';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Button } from '../Button/Button';
import { Text } from '../Text';
import { Card } from '../Card';
import { VStack } from '../Stack';
import { useBottomSheetAnimation } from './useBottomSheetAnimation';
import { useShakeAnimation } from './useShakeAnimation';

type AlertSheetProps = RequireAllOrNone<
    {
        isVisible: boolean;
        title: string;
        description: string;
        primaryButtonTitle: string;
        onPressPrimaryButton: () => void;
        secondaryButtonTitle?: string;
        onPressSecondaryButton?: () => void;
    },
    'secondaryButtonTitle' | 'onPressSecondaryButton'
>;

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

export const AlertSheet = ({
    isVisible,
    title,
    description,
    primaryButtonTitle,
    secondaryButtonTitle,
    onPressPrimaryButton,
    onPressSecondaryButton,
}: AlertSheetProps) => {
    const { applyStyle } = useNativeStyles();
    const { runShakeAnimation, shakeAnimatedStyle } = useShakeAnimation();
    const {
        animatedSheetWithOverlayStyle,
        animatedSheetWrapperStyle,
        closeSheetAnimated,
        openSheetAnimated,
    } = useBottomSheetAnimation({ isVisible });

    useEffect(() => {
        if (isVisible) {
            openSheetAnimated();
        }
    }, [isVisible, openSheetAnimated]);

    const handlePressPrimaryButton = () => {
        onPressPrimaryButton();
        closeSheetAnimated();
    };

    const handlePressSecondaryButton = () => {
        onPressSecondaryButton?.();
        closeSheetAnimated();
    };

    return (
        <Modal transparent visible={isVisible}>
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
                                    <Text color="textSubdued">{description}</Text>
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
