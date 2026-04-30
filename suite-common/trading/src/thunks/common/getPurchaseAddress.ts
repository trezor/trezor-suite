import { createThunk } from '@suite-common/redux-utils';
import { confirmAddressOnDeviceThunk, selectAddressDisplayType } from '@suite-common/wallet-core';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingSendRejectedProps } from '../../types';

type GetPurchaseAddressProps = {
    account: Account;
    address: string;
};

type GetPurchaseAddressFulfillValue = {
    address: string;
    mac: string;
    path: string;
};

export const getPurchaseAddress = createThunk<
    GetPurchaseAddressFulfillValue,
    GetPurchaseAddressProps,
    {
        rejectValue: TradingSendRejectedProps;
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
                error: {
                    id: 'TR_VERIFY_ERROR',
                },
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
                error: {
                    id: 'TR_VERIFY_ERROR',
                },
            });
        }

        if (!('mac' in purchase.payload) || !purchase.payload.mac) {
            return rejectWithValue({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_VERIFY_ERROR',
                },
            });
        }

        return fulfillWithValue({
            address: purchase.payload.address,
            mac: purchase.payload.mac,
            path: params.addressPath,
        });
    },
);
