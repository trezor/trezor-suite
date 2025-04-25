import { useCallback, useRef } from 'react';

import { BottomSheetModal } from '@gorhom/bottom-sheet';

export const useBottomSheetModal = () => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const openModal = useCallback(() => {
        bottomSheetRef.current?.present();
    }, []);

    const closeModal = useCallback(() => {
        bottomSheetRef.current?.dismiss();
    }, []);

    return {
        bottomSheetRef,
        openModal,
        closeModal,
    };
};
