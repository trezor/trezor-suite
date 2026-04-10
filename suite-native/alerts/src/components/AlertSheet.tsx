import { useEffect } from 'react';
import { Modal, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    AnimatedPressable,
    Box,
    Button,
    Card,
    Pictogram,
    TitleHeader,
    VStack,
    useAlertAnimation,
} from '@suite-native/atoms';
import { getScreenHeight, getScreenWidth } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type Alert } from '../alertsAtoms';
import { useAlert } from '../useAlert';
import { useShakeAnimation } from '../useShakeAnimation';

type AlertSheetProps = {
    alert: Alert;
};

const SCREEN_WIDTH = getScreenWidth();
const SCREEN_HEIGHT = getScreenHeight();

const alertSheetContainerStyle = prepareNativeStyle<{ bottomInset: number }>(
    (utils, { bottomInset }) => ({
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: utils.spacings.sp24,
        paddingVertical: utils.spacings.sp32,
        marginHorizontal: utils.spacings.sp16,
        borderRadius: utils.borders.radii.r16,
        marginBottom: bottomInset + utils.spacings.sp16,
        ...utils.boxShadows.small,
    }),
);

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

export const AlertSheet = ({ alert }: AlertSheetProps) => {
    const { hideAlert } = useAlert();
    const { applyStyle } = useNativeStyles();
    const { runShakeAnimation, shakeAnimatedStyle } = useShakeAnimation();
    const { bottom } = useSafeAreaInsets();

    const {
        animatedSheetWithOverlayStyle,
        animatedSheetWrapperStyle,
        closeSheetAnimated,
        openSheetAnimated,
    } = useAlertAnimation({ onClose: hideAlert });

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
        primaryButtonIconLeft,
        primaryButtonIconRight,
        onPressSecondaryButton,
        secondaryButtonTitle,
        primaryButtonColorProps = {
            intent: 'brand',
            priority: 'primary',
        },
        secondaryButtonColorProps = {
            intent: 'neutral',
            priority: 'secondary',
        },
        appendix,
        testID,
    } = alert;

    const handlePressPrimaryButton = async () => {
        onPressPrimaryButton?.();
        await closeSheetAnimated();
    };

    const handlePressSecondaryButton = async () => {
        onPressSecondaryButton?.();
        await closeSheetAnimated();
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
                    <Card style={applyStyle(alertSheetContainerStyle, { bottomInset: bottom })}>
                        <VStack style={applyStyle(alertSheetContentStyle)}>
                            {pictogramVariant && (
                                <Box alignItems="center">
                                    <Pictogram variant={pictogramVariant} icon={icon} />
                                </Box>
                            )}
                            <VStack spacing="sp20">
                                {(title || description) && (
                                    <TitleHeader
                                        title={title}
                                        subtitle={description}
                                        textAlign={textAlign}
                                        titleSpacing={titleSpacing}
                                    />
                                )}
                                {appendix}
                            </VStack>
                            <VStack spacing="sp12">
                                <Button
                                    {...primaryButtonColorProps}
                                    onPress={handlePressPrimaryButton}
                                    iconLeft={primaryButtonIconLeft}
                                    iconRight={primaryButtonIconRight}
                                    testID="@alert-sheet/primary-button"
                                >
                                    {primaryButtonTitle}
                                </Button>
                                {secondaryButtonTitle && (
                                    <Button
                                        {...secondaryButtonColorProps}
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
