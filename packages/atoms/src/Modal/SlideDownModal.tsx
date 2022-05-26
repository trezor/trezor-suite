import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { Modal } from './Modal';

type ModalProps = {
    isModalVisible: boolean;
    setIsModalVisible: (isVisible: boolean) => void;
    children: ReactNode;
    modalTrigger: ReactNode;
    title: string;
};

export const SlideDownModal = ({
    isModalVisible,
    setIsModalVisible,
    modalTrigger,
    title,
    children,
}: ModalProps) => {
    const handleCloseModal = () => {
        setIsModalVisible(false);
    };

    return (
        <View>
            <Modal
                title={title}
                isModalVisible={isModalVisible}
                handleCloseModal={handleCloseModal}
            >
                {children}
            </Modal>
            {modalTrigger}
        </View>
    );
};
