import { useCallback, useRef } from 'react';

import {
    type BottomSheetModal,
    useBottomSheetModal as useGorhomBottomSheetModal,
} from '@gorhom/bottom-sheet';

export const useBottomSheetModal = () => {
    const { dismiss } = useGorhomBottomSheetModal();
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const openModal = useCallback(() => {
        // When rapidly presenting and dismissing multiple bottom sheets, already dismissed bottom
        // sheet may reappear because dismiss() is not actually called until the closing animation
        // finishes & unmounts. Dismissing the last presented bottom sheet prevents this.
        dismiss();
        bottomSheetRef.current?.present();
    }, [dismiss]);

    const closeModal = useCallback(() => {
        bottomSheetRef.current?.dismiss();
    }, []);

    return {
        bottomSheetRef,
        openModal,
        closeModal,
    };
};
