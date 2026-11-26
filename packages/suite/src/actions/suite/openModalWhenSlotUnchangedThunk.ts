import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type ModalRootState, type ModalState, openModal, selectModal } from '@suite/modal';
import { type UserContextPayload } from '@suite-common/suite-types';

type OpenModalWhenSlotUnchangedThunkState = ModalRootState;

/**
 * Opens a modal only while the slot still holds what it did when its chunk started loading.
 * Device and connection modals share that one slot, so a prompt that arrived during the load
 * would otherwise be replaced on arrival, leaving the device waiting for an answer.
 */
export const openModalWhenSlotUnchangedThunk =
    (payload: UserContextPayload, expected: ModalState) =>
    (dispatch: Dispatch<UnknownAction>, getState: () => OpenModalWhenSlotUnchangedThunkState) => {
        /** The reducer returns a new object on every change, so identity is the whole test. */
        if (selectModal(getState()) !== expected) {
            return;
        }

        dispatch(openModal(payload));
    };
