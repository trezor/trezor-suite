import { useCallback, useRef } from 'react';
import { KeyboardController } from 'react-native-keyboard-controller';

import {
    type BottomSheetModal,
    useBottomSheetModal as useGorhomBottomSheetModal,
} from '@gorhom/bottom-sheet';

type BottomSheetModalProps = {
    isNestedSheet?: boolean;
};

export const useBottomSheetModal = ({ isNestedSheet = false }: BottomSheetModalProps = {}) => {
    const { dismiss, dismissAll } = useGorhomBottomSheetModal();
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const openModal = useCallback(() => {
        if (!isNestedSheet) {
            dismissAll();
            void KeyboardController.dismiss({ animated: false });
            // When rapidly presenting and dismissing multiple bottom sheets, already dismissed bottom
            // sheet may reappear because dismiss() is not actually called until the closing animation
            // finishes & unmounts. Dismissing the last presented bottom sheet prevents this.
            dismiss();
        }
        bottomSheetRef.current?.present();
    }, [dismissAll, dismiss, isNestedSheet]);

    const closeModal = useCallback(() => {
        bottomSheetRef.current?.dismiss();
    }, []);

    return {
        bottomSheetRef,
        openModal,
        closeModal,
    };
};
