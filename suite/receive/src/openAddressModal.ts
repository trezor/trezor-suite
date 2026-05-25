import { type Dispatch } from '@reduxjs/toolkit';

import { openModal } from '@suite/modal';
import { type UserContextPayload } from '@suite-common/suite-types';

import { receiveActions } from './receiveReducer';

type OpenAddressModalParams = Pick<
    Extract<UserContextPayload, { type: 'address' }>,
    'addressPath' | 'value' | 'isConfirmed'
>;

export const openAddressModal = (params: OpenAddressModalParams) => (dispatch: Dispatch) => {
    dispatch(
        openModal({
            type: 'address',
            ...params,
        }),
    );
    dispatch(
        params.isConfirmed
            ? receiveActions.showAddress(params.addressPath, params.value)
            : receiveActions.showUnverifiedAddress(params.addressPath, params.value),
    );
};
