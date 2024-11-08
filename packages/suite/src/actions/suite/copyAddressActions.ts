import { Dispatch } from 'redux';

import { AddressType } from '@suite-common/wallet-types';
import { copyToClipboard } from '@trezor/dom-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import { openModal } from 'src/actions/suite/modalActions';

export const showCopyAddressModal =
    (address: string, addressType: AddressType) => (dispatch: Dispatch) => {
        dispatch(
            openModal({
                type: 'copy-address',
                addressType,
                address,
            }),
        );
    };

export const copyAddressToClipboard = (address: string) => (dispatch: Dispatch) => {
    const result = copyToClipboard(address);

    const isSuccess = result === true;

    if (isSuccess) {
        dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
    }
};
