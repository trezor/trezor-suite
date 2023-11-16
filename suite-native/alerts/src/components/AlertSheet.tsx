import { useEffect } from 'react';
import { Modal, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Button, Card, VStack, useBottomSheetAnimation, Pictogram, Box } from '@suite-native/atoms';
import { BlurredScreenOverlay } from '@suite-native/screen-overlay';

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
    paddingVertical: utils.spacings.extraLarge,
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

    const { animatedSheetWrapperStyle, closeSheetAnimated, openSheetAnimated } =
        useBottomSheetAnimation({ onClose: hideAlert, isVisible: true });

    useEffect(() => {
        openSheetAnimated();
    }, [openSheetAnimated]);

    const {
        title,
        description,
        icon,
        pictogramVariant,
        onPressPrimaryButton,
        primaryButtonTitle,
        onPressSecondaryButton,
        secondaryButtonTitle,
        primaryButtonVariant = 'primary',
        appendix,
    } = alert;

    const handlePressPrimaryButton = async () => {
        await closeSheetAnimated();
        onPressPrimaryButton?.();
    };

    const handlePressSecondaryButton = async () => {
        await closeSheetAnimated();
        onPressSecondaryButton?.();
    };

    return (
        <Modal transparent visible={!!alert}>
            <BlurredScreenOverlay />
            <Box style={applyStyle(sheetOverlayStyle)}>
                <Pressable onPress={runShakeAnimation} style={applyStyle(shakeTriggerStyle)}>
                    <Animated.View
                        style={[animatedSheetWrapperStyle, shakeAnimatedStyle]}
                        onStartShouldSetResponder={_ => true} // Stop the shake event trigger propagation.
                    >
                        <Card style={applyStyle(alertSheetContainerStyle)}>
                            <VStack style={applyStyle(alertSheetContentStyle)} spacing="large">
                                <Pictogram
                                    title={title}
                                    variant={pictogramVariant}
                                    subtitle={description}
                                    icon={icon}
                                />
                                {appendix}
                                <VStack spacing="medium">
                                    <Button
                                        size="large"
                                        colorScheme={primaryButtonVariant}
                                        onPress={handlePressPrimaryButton}
                                    >
                                        {primaryButtonTitle}
                                    </Button>
                                    {secondaryButtonTitle && (
                                        <Button
                                            size="large"
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
            </Box>
        </Modal>
    );
};
