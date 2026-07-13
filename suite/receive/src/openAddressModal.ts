import { type Dispatch } from '@reduxjs/toolkit';

import { openModal } from '@suite/modal';
import { receiveActions } from '@suite-common/receive';
import { type UserContextPayload } from '@suite-common/suite-types';
import { type AccountKey } from '@suite-common/wallet-types';

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
        receiveActions.showAddress({
            accountKey: params.accountKey,
            path: params.addressPath,
            address: params.value,
        }),
    );
};
