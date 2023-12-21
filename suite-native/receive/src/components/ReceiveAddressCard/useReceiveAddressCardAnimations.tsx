import { useEffect } from 'react';
import { withDelay, withTiming, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { QRCODE_SIZE } from '@suite-native/qr-code/src';
import { useNativeStyles } from '@trezor/styles';

import { ReceiveProgressStep } from '../../hooks/useReceiveProgressSteps';

const DEVICE_MIN_PADING_TOP = 0;
const DEVICE_MID_PADING_TOP = 20;
const DEVICE_MAX_PADING_TOP = 36;

export const useReceiveAddressCardAnimations = ({
    receiveProgressStep,
}: {
    receiveProgressStep: ReceiveProgressStep;
}) => {
    const { utils } = useNativeStyles();
    const qrHeight = useSharedValue(0);
    const qrOpacity = useSharedValue(0);
    const buttonsOpacity = useSharedValue(0);
    const addressPaddingTop = useSharedValue(DEVICE_MIN_PADING_TOP);
    const isShowingQRCode = useSharedValue(false);
    const isShowedDeviceQRStep = receiveProgressStep === ReceiveProgressStep.ApprovedOnTrezor;
    const isShowedPortfolioQRStep =
        receiveProgressStep === ReceiveProgressStep.ShownPortfolioAddress;

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        if (isShowedDeviceQRStep) {
            qrHeight.value = QRCODE_SIZE;
            qrOpacity.value = 1;
            buttonsOpacity.value = 1;
            addressPaddingTop.value = DEVICE_MIN_PADING_TOP;
            const qrCodeRevealTimeMs = isShowedPortfolioQRStep ? 10 : 600;
            timer = setTimeout(() => {
                isShowingQRCode.value = true;
            }, qrCodeRevealTimeMs);
            addressPaddingTop.value = withDelay(
                qrCodeRevealTimeMs + 1300,
                withTiming(DEVICE_MAX_PADING_TOP, {
                    duration: 600,
                }),
            );
        } else if (isShowedPortfolioQRStep) {
            buttonsOpacity.value = 1;
        } else if (receiveProgressStep === ReceiveProgressStep.ShownUncheckedAddress) {
            addressPaddingTop.value = DEVICE_MAX_PADING_TOP;
        } else {
            addressPaddingTop.value = DEVICE_MID_PADING_TOP;
        }
        return () => clearTimeout(timer);
    }, [
        qrHeight,
        qrOpacity,
        buttonsOpacity,
        addressPaddingTop,
        isShowingQRCode,
        receiveProgressStep,
        isShowedDeviceQRStep,
        isShowedPortfolioQRStep,
    ]);

    const addressQRStyle = useAnimatedStyle(
        () => ({
            height: withDelay(1300, withTiming(qrHeight.value, { duration: 600 })),
            opacity: withDelay(1500, withTiming(qrOpacity.value, { duration: 600 })),
        }),
        [],
    );

    const deviceScreenStyle = useAnimatedStyle(
        () => ({
            paddingTop: addressPaddingTop.value,
        }),
        [],
    );
    const buttonsStyle = useAnimatedStyle(
        () => ({
            opacity: withDelay(1600, withTiming(buttonsOpacity.value, { duration: 300 })),
            paddingTop: isShowedPortfolioQRStep ? 0 : utils.spacings.large,
        }),
        [utils],
    );

    return {
        addressQRStyle,
        deviceScreenStyle,
        buttonsStyle,
        isShowedDeviceQRStep,
        isShowedPortfolioQRStep,
    };
};
