import { type Dispatch } from '@reduxjs/toolkit';

import { type ModalRootState, selectUserContextModalPayload } from '@suite/modal';
import { notificationsActions } from '@suite-common/toast-notifications';
import { sendFormActions } from '@suite-common/wallet-core';

type CancelSigningModalOnDisconnectThunkState = ModalRootState;

export const cancelSigningModalOnDisconnectThunk =
    () => (dispatch: Dispatch, getState: () => CancelSigningModalOnDisconnectThunkState) => {
        const modal = selectUserContextModalPayload(getState());

        switch (modal?.type) {
            case 'review-transaction':
                modal.decision.resolve(false);
                dispatch(sendFormActions.discardTransaction());
                break;
            case 'earn-yield-tx-simulation':
                modal.decision.resolve({ value: false });
                break;
            case 'tron-vote-consent':
                modal.decision.resolve(false);
                break;
            default:
                return;
        }

        dispatch(
            notificationsActions.addToast({ type: 'sign-tx-error', error: 'Device disconnected' }),
        );
    };
