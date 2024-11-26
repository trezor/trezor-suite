import { Image, Pressable } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import React, { ReactNode, useMemo, useState } from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ConfirmOnTrezorBottomSheet } from './ConfirmOnTrezorBottomSheet';

type ConfirmOnTrezorImageProps = {
    bottomSheetText: ReactNode;
};

const imageContainerStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    bottom: utils.spacings.sp4 * -1, // Hides a part of the image under bottom screen edge.
    width: '100%',
    alignItems: 'center',
}));

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ConfirmOnTrezorImage = ({ bottomSheetText }: ConfirmOnTrezorImageProps) => {
    const [isBottomSheetOpened, setIsBottomSheetOpened] = useState(false);
    const { applyStyle } = useNativeStyles();

    const imageSource = useMemo(() => require('../assets/confirmOnTrezor.png'), []);

    const handleImagePress = () => {
        setIsBottomSheetOpened(true);
    };

    const handleCloseBottomSheet = () => {
        setIsBottomSheetOpened(false);
    };

    return (
        <>
            <AnimatedPressable
                entering={SlideInDown}
                exiting={SlideOutDown}
                style={applyStyle(imageContainerStyle)}
                onPress={handleImagePress}
            >
                <Image source={imageSource} />
            </AnimatedPressable>
            <ConfirmOnTrezorBottomSheet
                text={bottomSheetText}
                isOpened={isBottomSheetOpened}
                onClose={handleCloseBottomSheet}
            />
        </>
    );
};
