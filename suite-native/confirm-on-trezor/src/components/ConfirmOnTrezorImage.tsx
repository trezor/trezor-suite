import React, { type ReactNode, useMemo } from 'react';
import { Image } from 'react-native';
import { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { AnimatedPressable, useBottomSheetModal } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ConfirmOnTrezorBottomSheet } from './ConfirmOnTrezorBottomSheet';

type ConfirmOnTrezorImageProps = {
    bottomSheetText?: ReactNode;
};

const imageContainerStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    bottom: utils.spacings.sp4 * -1, // Hides a part of the image under bottom screen edge.
    left: 0,
    right: 0,
    alignItems: 'center',
}));

export const ConfirmOnTrezorImage = ({ bottomSheetText }: ConfirmOnTrezorImageProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const { applyStyle } = useNativeStyles();

    const imageSource = useMemo(() => require('../assets/confirmOnTrezor.webp'), []);

    return (
        <>
            <AnimatedPressable
                entering={SlideInDown}
                exiting={SlideOutDown}
                style={applyStyle(imageContainerStyle)}
                onPress={openModal}
            >
                <Image source={imageSource} />
            </AnimatedPressable>
            {bottomSheetText && (
                <ConfirmOnTrezorBottomSheet
                    ref={bottomSheetRef}
                    text={bottomSheetText}
                    onClose={closeModal}
                />
            )}
        </>
    );
};
