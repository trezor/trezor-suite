import { type AnyAction } from 'redux';
import { type ThunkDispatch } from 'redux-thunk';

import { openModal } from '@suite/modal';
import { type UserContextPayload } from '@suite-common/suite-types';

import { showAddressAction, showUnverifiedAddressAction } from './receiveReducer';

type OpenAddressModalParams = Pick<
    Extract<UserContextPayload, { type: 'address' }>,
    'addressPath' | 'value' | 'isConfirmed'
>;

type Dispatch = ThunkDispatch<unknown, unknown, AnyAction>;

export const openAddressModal = (params: OpenAddressModalParams) => (dispatch: Dispatch) => {
    dispatch(
        openModal({
            type: 'address',
            ...params,
        }),
    );
    dispatch(
        params.isConfirmed
            ? showAddressAction(params.addressPath, params.value)
            : showUnverifiedAddressAction(params.addressPath, params.value),
    );
};
