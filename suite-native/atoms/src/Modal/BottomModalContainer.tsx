import React, { ReactNode } from 'react';
import { Modal as RNModal, View } from 'react-native';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ModalProps = {
    children: ReactNode;
    isVisible: boolean;
    onClose: () => void;
};

const modalWithOverlayStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: utils.transparentize(0.3, utils.colors.black),
}));

export const BottomModalContainer = ({ children, isVisible, onClose }: ModalProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <RNModal transparent visible={isVisible} onRequestClose={onClose} animationType="fade">
            <View style={applyStyle(modalWithOverlayStyle)}>{children}</View>
        </RNModal>
    );
};
