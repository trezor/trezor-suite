import { useBottomSheetControls } from './useBottomSheetControls';
import { type UseBottomSheetModalProps, useBottomSheetModal } from './useBottomSheetModal';

export const useBottomSheetModalControls = (props?: UseBottomSheetModalProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal(props);
    const bottomSheetControls = useBottomSheetControls({
        onShowSheet: openModal,
        onHideSheet: closeModal,
    });

    return {
        bottomSheetRef,
        ...bottomSheetControls,
    };
};
