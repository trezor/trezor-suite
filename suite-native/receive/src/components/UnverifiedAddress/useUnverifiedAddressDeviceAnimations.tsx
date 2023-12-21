import { useEffect, useState } from 'react';
import {
    interpolateColor,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNativeStyles } from '@trezor/styles';
import { selectDeviceModel } from '@suite-common/wallet-core';

import { DEVICE_SCREEN_BACKGROUND_COLOR } from '../../constants';
import { isPaginationCompatibleDeviceModel } from '../../types';
import { ReceiveProgressStep, isAddressRevealed } from '../../hooks/useReceiveProgressSteps';

const DEVICE_SCREEN_WIDTH = 340;
const DEVICE_SCREEN_HEIGHT = 200;

export const useUnverifiedAddressDeviceAnimations = ({
    receiveProgressStep,
    isCardanoAddress,
}: {
    receiveProgressStep: ReceiveProgressStep;
    isCardanoAddress: boolean;
}) => {
    const { utils } = useNativeStyles();
    const frameBorderColorProgress = useSharedValue(0);
    const deviceHeightDifference = useSharedValue(0);
    const buttonsOpacity = useSharedValue(0);
    const [isHintVisible, setIsHintVisible] = useState(false);

    const deviceModel = useSelector(selectDeviceModel);

    const isPaginationEnabled = isCardanoAddress && isPaginationCompatibleDeviceModel(deviceModel);

    const isReceiveApproved = receiveProgressStep === ReceiveProgressStep.ApprovedOnTrezor;
    const isRevealedAddress = isAddressRevealed(receiveProgressStep);

    const deviceScreenStyle = useAnimatedStyle(
        () => ({
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: DEVICE_SCREEN_HEIGHT - deviceHeightDifference.value,
            paddingVertical: isPaginationEnabled || isReceiveApproved ? utils.spacings.small : 40,
            maxWidth: DEVICE_SCREEN_WIDTH,
            backgroundColor: DEVICE_SCREEN_BACKGROUND_COLOR,
            borderRadius: utils.borders.radii.large / 2,
            gap: utils.spacings.large,
        }),
        [utils, isReceiveApproved, deviceHeightDifference],
    );

    const deviceFrameStyle = useAnimatedStyle(
        () => ({
            width: DEVICE_SCREEN_WIDTH,
            padding: utils.spacings.extraSmall,
            borderWidth: utils.borders.widths.small,
            borderRadius: utils.borders.radii.large / 2,
            backgroundColor: interpolateColor(
                frameBorderColorProgress.value,
                [0, 1],
                [utils.colors.transparent, utils.colors.backgroundPrimarySubtleOnElevation0],
            ),
            borderColor: interpolateColor(
                frameBorderColorProgress.value,
                [0, 1],
                [utils.colors.borderOnElevation1, utils.colors.textSecondaryHighlight],
            ),
        }),
        [utils, isReceiveApproved],
    );
    const buttonsStyle = useAnimatedStyle(
        () => ({
            opacity: buttonsOpacity.value,
        }),
        [],
    );

    useEffect(() => {
        frameBorderColorProgress.value = withTiming(
            (isReceiveApproved ? 1 : 0) - frameBorderColorProgress.value,
            {
                duration: 600,
            },
        );
        deviceHeightDifference.value = withDelay(
            1000,
            withTiming((isReceiveApproved ? 60 : 0) - deviceHeightDifference.value, {
                duration: 600,
            }),
        );

        let timer: ReturnType<typeof setTimeout>;

        if (isRevealedAddress) {
            if (isReceiveApproved) {
                buttonsOpacity.value = withDelay(
                    1000,
                    withTiming(
                        0,
                        {
                            duration: 600,
                        },
                        isFinished => {
                            if (isFinished) {
                                runOnJS(setIsHintVisible)(false);
                            }
                        },
                    ),
                );
            } else {
                buttonsOpacity.value = 1;
                setIsHintVisible(true);
            }
        }
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReceiveApproved, isRevealedAddress]);

    return {
        deviceScreenStyle,
        deviceFrameStyle,
        buttonsStyle,
        isHintVisible,
        frameBorderColorProgress,
        deviceHeightDifference,
        buttonsOpacity,
    };
};
