import { useState } from 'react';

import { ModalProps } from './Modal';

export const useModal = <T extends ModalProps>(ModalComponent: React.ComponentType<T>) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);

    return {
        openModal,
        Modal: (props: Omit<T, 'onCancel'>) =>
            isModalOpen ? (
                <ModalComponent {...(props as T)} onCancel={() => setIsModalOpen(false)} />
            ) : null,
    };
};
