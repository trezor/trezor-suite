import { useState } from 'react';

export function useModal(initialOpen: boolean = false) {
    const [open, setOpen] = useState(initialOpen);

    function openModal() {
        setOpen(true);
    }

    function closeModal() {
        setOpen(false);
    }

    function toggleModal() {
        setOpen(prev => !prev);
    }

    return {
        open,
        openModal,
        closeModal,
        toggleModal,
    } as const;
}
