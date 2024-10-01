import { useEffect } from 'react';
import { Modal, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    Button,
    Card,
    VStack,
    useBottomSheetAnimation,
    TitleHeader,
    Pictogram,
    Box,
} from '@suite-native/atoms';

import { useShakeAnimation } from '../useShakeAnimation';
import { Alert } from '../alertsAtoms';
import { useAlert } from '../useAlert';

type AlertSheetProps = {
    alert: Alert;
};

const alertSheetContainerStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: utils.spacings.sp32,
    paddingHorizontal: utils.spacings.sp24,
    paddingVertical: utils.spacings.sp32,
    marginBottom: utils.spacings.sp32,
    marginHorizontal: utils.spacings.sp8,
    borderRadius: utils.borders.radii.medium,
    ...utils.boxShadows.small,
}));

const alertSheetContentStyle = prepareNativeStyle(utils => ({
    width: '100%',
    gap: utils.spacings.sp24,
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
            <Animated.View style={[animatedSheetWithOverlayStyle, applyStyle(sheetOverlayStyle)]}>
                <Pressable onPress={runShakeAnimation} style={applyStyle(shakeTriggerStyle)}>
                    <Animated.View
                        style={[animatedSheetWrapperStyle, shakeAnimatedStyle]}
                        onStartShouldSetResponder={_ => true} // Stop the shake event trigger propagation.
                    >
                        <Card style={applyStyle(alertSheetContainerStyle)}>
                            <VStack style={applyStyle(alertSheetContentStyle)}>
                                {icon && pictogramVariant && (
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
                                <VStack spacing="sp16">
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
                </Pressable>
            </Animated.View>
        </Modal>
    );
};
