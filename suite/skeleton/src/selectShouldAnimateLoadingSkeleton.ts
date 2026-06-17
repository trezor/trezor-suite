import { type ModalRootState, selectHasActiveModal } from '@suite/modal';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';

export type LoadingSkeletonRootState = DeviceRootState & ModalRootState;

export const selectShouldAnimateLoadingSkeleton = (state: LoadingSkeletonRootState): boolean =>
    !selectHasActiveModal(state) && !!selectSelectedDevice(state)?.state;
