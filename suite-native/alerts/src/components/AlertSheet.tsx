import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import {
    Box,
    Button,
    Card,
    Pictogram,
    TitleHeader,
    VStack,
    useBottomSheetAnimation,
} from '@suite-native/atoms';
import { getScreenHeight, getScreenWidth } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Alert } from '../alertsAtoms';
import { useAlert } from '../useAlert';
import { useShakeAnimation } from '../useShakeAnimation';

type AlertSheetProps = {
    alert: Alert;
};

const SCREEN_WIDTH = getScreenWidth();
const SCREEN_HEIGHT = getScreenHeight();

const alertSheetContainerStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: utils.spacings.sp24,
    paddingVertical: utils.spacings.sp32,
    marginBottom: utils.spacings.sp32,
    marginHorizontal: utils.spacings.sp8,
    borderRadius: utils.borders.radii.r16,
    ...utils.boxShadows.small,
}));

const alertSheetContentStyle = prepareNativeStyle(utils => ({
    width: '100%',
    gap: utils.spacings.sp32,
}));

const shakeTriggerStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'flex-end',
}));

const sheetOverlayStyle = prepareNativeStyle(_ => ({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    ...StyleSheet.absoluteFillObject,
}));

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
        textAlign = 'center',
        titleSpacing,
        description,
        icon,
        pictogramVariant,
        onPressPrimaryButton,
        primaryButtonTitle,
        primaryButtonViewLeft,
        onPressSecondaryButton,
        secondaryButtonTitle,
        primaryButtonVariant = 'primary',
        secondaryButtonVariant = 'tertiaryElevation1',
        appendix,
        testID,
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
        <Modal transparent visible={!!alert} testID={testID}>
            <Animated.View style={[applyStyle(sheetOverlayStyle), animatedSheetWithOverlayStyle]} />
            <AnimatedPressable
                onPress={runShakeAnimation}
                style={[animatedSheetWrapperStyle, applyStyle(shakeTriggerStyle)]}
            >
                <Animated.View
                    style={shakeAnimatedStyle}
                    onStartShouldSetResponder={_ => true} // Stop the shake event trigger propagation.
                >
                    <Card style={applyStyle(alertSheetContainerStyle)}>
                        <VStack style={applyStyle(alertSheetContentStyle)}>
                            {pictogramVariant && (
                                <Box alignItems="center">
                                    <Pictogram variant={pictogramVariant} icon={icon} />
                                </Box>
                            )}
                            {(title || description) && (
                                <TitleHeader
                                    title={title}
                                    subtitle={description}
                                    textAlign={textAlign}
                                    titleSpacing={titleSpacing}
                                />
                            )}
                            {appendix}
                            <VStack spacing="sp12">
                                <Button
                                    size="medium"
                                    colorScheme={primaryButtonVariant}
                                    onPress={handlePressPrimaryButton}
                                    viewLeft={primaryButtonViewLeft}
                                    testID="@alert-sheet/primary-button"
                                >
                                    {primaryButtonTitle}
                                </Button>
                                {secondaryButtonTitle && (
                                    <Button
                                        size="medium"
                                        colorScheme={secondaryButtonVariant}
                                        onPress={handlePressSecondaryButton}
                                        testID="@alert-sheet/secondary-button"
                                    >
                                        {secondaryButtonTitle}
                                    </Button>
                                )}
                            </VStack>
                        </VStack>
                    </Card>
                </Animated.View>
            </AnimatedPressable>
        </Modal>
    );
};
