import { type ModalRootState, selectHasActiveModal } from '@suite/modal';
import { type DeviceRootState, selectIsDeviceAuthorized } from '@suite-common/device';

type LoadingSkeletonRootState = DeviceRootState & ModalRootState;

export const selectShouldAnimateLoadingSkeleton = (state: LoadingSkeletonRootState): boolean =>
    !selectHasActiveModal(state) && selectIsDeviceAuthorized(state);
