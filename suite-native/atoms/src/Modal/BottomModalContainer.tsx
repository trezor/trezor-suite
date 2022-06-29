import React, { ReactNode } from 'react';
import { Modal as RNModal } from 'react-native';
import { BottomModalGestureHandler } from './BottomModalGestureHandler';

type ModalProps = {
    children: ReactNode;
    isVisible: boolean;
    onClose: () => void;
};

export const BottomModalContainer = ({ children, isVisible, onClose }: ModalProps) => (
    <RNModal transparent visible={isVisible} onRequestClose={onClose} animationType="fade">
        <BottomModalGestureHandler>{children}</BottomModalGestureHandler>
    </RNModal>
);
