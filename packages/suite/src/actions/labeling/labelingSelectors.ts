import { DesktopLabelingRootState } from './labelingSlice';

export const selectShowEnableLocalFirstStorageModal = (state: DesktopLabelingRootState): boolean =>
    state.labeling.showEnableLocalFirstStorageModal;
