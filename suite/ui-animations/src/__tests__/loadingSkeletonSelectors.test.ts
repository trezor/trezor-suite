import { MODAL_CONTEXT_NONE, MODAL_CONTEXT_USER, type ModalRootState } from '@suite/modal';
import { type DeviceRootState } from '@suite-common/device';

import { selectShouldAnimateLoadingSkeleton } from '../loadingSkeletonSelectors';

type LoadingSkeletonRootState = DeviceRootState & ModalRootState;

const getState = ({
    hasActiveModal = false,
    isDeviceAuthorized = true,
}: {
    hasActiveModal?: boolean;
    isDeviceAuthorized?: boolean;
} = {}): LoadingSkeletonRootState =>
    ({
        device: {
            selectedDevice: isDeviceAuthorized
                ? {
                      state: {
                          staticSessionId: 'static-session-id',
                      },
                  }
                : undefined,
        },
        modal: hasActiveModal
            ? {
                  context: MODAL_CONTEXT_USER,
              }
            : {
                  context: MODAL_CONTEXT_NONE,
              },
    }) as unknown as LoadingSkeletonRootState;

describe(selectShouldAnimateLoadingSkeleton.name, () => {
    it('allows animation when no modal is active and the selected device is authorized', () => {
        expect(selectShouldAnimateLoadingSkeleton(getState())).toBe(true);
    });

    it('blocks animation when a modal is active', () => {
        expect(selectShouldAnimateLoadingSkeleton(getState({ hasActiveModal: true }))).toBe(false);
    });

    it('blocks animation when the selected device is not authorized', () => {
        expect(selectShouldAnimateLoadingSkeleton(getState({ isDeviceAuthorized: false }))).toBe(
            false,
        );
    });
});
