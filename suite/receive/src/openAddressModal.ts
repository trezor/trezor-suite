import { type Dispatch } from '@reduxjs/toolkit';

import { openModal } from '@suite/modal';
import { type UserContextPayload } from '@suite-common/suite-types';
import { type AccountKey } from '@suite-common/wallet-types';

import { receiveActions } from './receiveReducer';

type OpenAddressModalParams = Pick<
    Extract<UserContextPayload, { type: 'address' }>,
    'addressPath' | 'value' | 'isConfirmed'
> & {
    accountKey: AccountKey;
};

export const openAddressModal = (params: OpenAddressModalParams) => (dispatch: Dispatch) => {
    dispatch(
        openModal({
            type: 'address',
            addressPath: params.addressPath,
            value: params.value,
            isConfirmed: params.isConfirmed,
        }),
    );
    dispatch(
        params.isConfirmed
            ? receiveActions.showAddress(params.accountKey, params.addressPath, params.value)
            : receiveActions.showUnverifiedAddress(
                  params.accountKey,
                  params.addressPath,
                  params.value,
              ),
    );
};
