import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { Modal } from './Modal';

type ModalProps = {
    isModalVisible: boolean;
    setIsModalVisible: (isVisible: boolean) => void;
    children: ReactNode;
    modalTrigger: ReactNode;
};

export const SlideDownModal = ({
    isModalVisible,
    setIsModalVisible,
    modalTrigger,
    children,
}: ModalProps) => {
    const handleCloseModal = () => {
        setIsModalVisible(false);
    };

    return (
        <View>
            <Modal isModalVisible={isModalVisible} handleCloseModal={handleCloseModal}>
                {children}
            </Modal>
            {modalTrigger}
        </View>
    );
};
