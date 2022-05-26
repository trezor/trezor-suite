import React, { ReactNode } from 'react';
import { Modal as RNModal } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { ModalBody } from './ModalBody';
import { Box } from '../Box';

type ModalProps = {
    children: ReactNode;
    isModalVisible: boolean;
    handleCloseModal: () => void;
    title: string;
};

const modalStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
}));

export const Modal = ({ children, isModalVisible, title, handleCloseModal }: ModalProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <RNModal transparent visible={isModalVisible} onRequestClose={handleCloseModal}>
            <Box style={applyStyle(modalStyle)}>
                <ModalBody onClose={handleCloseModal} title={title}>
                    {children}
                </ModalBody>
            </Box>
        </RNModal>
    );
};
