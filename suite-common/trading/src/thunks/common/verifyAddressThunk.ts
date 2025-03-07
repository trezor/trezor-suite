import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { confirmAddressOnDeviceThunk, selectSelectedDevice } from '@suite-common/wallet-core';
import { Account, AddressDisplayOptions } from '@suite-common/wallet-types';

import { TRADING_THUNK_COMMON_PREFIX } from '../';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingActions } from '../../reducers/tradingReducer';
import { getUnusedAddressFromAccount } from '../../utils';

export interface VerifyAddressThunk {
    account: Account;
    address: string | undefined;
    path: string | undefined;
    tradingAction: typeof tradingBuyActions.verifyAddress.type;
    // TODO: | typeof TRADING_EXCHANGE.VERIFY_ADDRESS;
}

export const verifyAddressThunk = createThunk(
    `${TRADING_THUNK_COMMON_PREFIX}/verifyAddress`,
    async (
        { account, address, path, tradingAction }: VerifyAddressThunk,
        { dispatch, getState, extra },
    ) => {
        const device = selectSelectedDevice(getState());
        if (!device) return;
        const accountAddress = getUnusedAddressFromAccount(account);
        address = address ?? accountAddress.address;
        path = path ?? accountAddress.path;
        if (!path || !address) return;

        dispatch(tradingActions.setModalAccountKey(account.key));

        const addressDisplayType = extra.selectors.selectAddressDisplayType(getState());

        const { useEmptyPassphrase, connected, available } = device;

        // Show warning when device is not connected
        if (!connected || !available) {
            dispatch(
                extra.actions.openModal({
                    type: 'unverified-address-proceed',
                    value: address,
                }),
            );

            return;
        }

        const params = {
            device,
            accountKey: account.key,
            addressPath: path,
            useEmptyPassphrase,
            coin: account.symbol,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        };

        const response = await dispatch(confirmAddressOnDeviceThunk(params)).unwrap();

        if (response.success) {
            dispatch({
                type: tradingAction,
                payload: address,
            });
        } else {
            // special case: device no-backup permissions not granted
            if (response.payload.code === 'Method_PermissionsNotGranted') return;

            dispatch(
                notificationsActions.addToast({
                    type: 'verify-address-error',
                    error: response.payload.error,
                }),
            );
        }
    },
);
