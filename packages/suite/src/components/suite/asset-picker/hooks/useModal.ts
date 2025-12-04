import { useCallback, useState } from 'react';

export function useModal(initialOpen: boolean = false) {
    const [open, setOpen] = useState(initialOpen);

    const openModal = useCallback(() => {
        setOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setOpen(false);
    }, []);

    const toggleModal = useCallback(() => {
        setOpen(prev => !prev);
    }, []);

    return {
        open,
        openModal,
        closeModal,
        toggleModal,
    } as const;
}
