import React, { ReactNode } from 'react';
import { Modal, View, Dimensions } from 'react-native';
import { ModalBody } from './ModalBody';
import { Button } from './Button';

type ModalProps = {
    isModalVisible: boolean;
    setIsModalVisible: (isVisible: boolean) => void;
    children: ReactNode;
};

export const SlideDownModal = ({ isModalVisible, setIsModalVisible, children }: ModalProps) => {
    const handleCloseModal = () => {
        console.log('handle close modal');
        setIsModalVisible(false);
    };

    console.log(Dimensions.get('window'));
    return (
        <View>
            <Modal
                animationType="slide"
                transparent
                visible={isModalVisible}
                onRequestClose={handleCloseModal}
            >
                {/* <Overlay /> */}
                <ModalBody onClose={handleCloseModal}>{children}</ModalBody>
            </Modal>
            <Button onPress={() => setIsModalVisible(true)} colorScheme="primary" size="md">
                Show Modal
            </Button>
        </View>
    );
};
