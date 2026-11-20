import {
    type ConfirmAddressOnDeviceThunkState,
    type WalletSettingsRootState,
    confirmAddressOnDeviceThunk,
    selectAddressDisplayType,
} from '@suite-common/wallet-core';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingError } from '../../types';
import { getConnectErrorCause } from '../../utils/tradingErrorUtils';

type GetPurchaseAddressProps = {
    account: Account;
    address: string;
};

type GetPurchaseAddressFulfillValue = {
    address: string;
    mac: string;
    path: string;
};

export type GetPurchaseAddressThunkState = ConfirmAddressOnDeviceThunkState &
    WalletSettingsRootState;

export const getPurchaseAddressThunk = createThunk<
    GetPurchaseAddressFulfillValue,
    GetPurchaseAddressProps,
    {
        rejectValue: TradingError;
        state: GetPurchaseAddressThunkState;
    }
>(
    `${TRADING_THUNK_PREFIX}/getPurchaseAddress`,
    async ({ account, address }, { getState, dispatch, rejectWithValue, fulfillWithValue }) => {
        let path: string | undefined;

        if (account.addresses) {
            const accountAddress = [
                ...account.addresses.change,
                ...account.addresses.used,
                ...account.addresses.unused,
            ].find(a => a.address === address);
            path = accountAddress?.path;
        } else if (account.descriptor === address) {
            path = account.path;
        }

        if (!path) {
            return rejectWithValue({
                type: 'sign-tx-error',
                code: 'verify-address-failed',
            });
        }

        const addressDisplayType = selectAddressDisplayType(getState());

        const params: Parameters<typeof confirmAddressOnDeviceThunk>[0] = {
            accountKey: account.key,
            addressPath: path,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
            showOnTrezor: false,
        };

        const purchase = await dispatch(confirmAddressOnDeviceThunk(params)).unwrap();

        if (!purchase.success) {
            return rejectWithValue({
                type: 'sign-tx-error',
                code: 'verify-address-failed',
                cause: getConnectErrorCause(purchase.error),
            });
        }

        if (!('mac' in purchase.payload) || !purchase.payload.mac) {
            return rejectWithValue({
                type: 'sign-tx-error',
                code: 'verify-address-failed',
            });
        }

        return fulfillWithValue({
            address: purchase.payload.address,
            mac: purchase.payload.mac,
            path: params.addressPath,
        });
    },
);
