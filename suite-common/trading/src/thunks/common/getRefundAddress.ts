import { createThunk } from '@suite-common/redux-utils';
import { confirmAddressOnDeviceThunk, selectAddressDisplayType } from '@suite-common/wallet-core';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingSendRejectedProps } from '../../types';
import { getUnusedAddressFromAccount } from '../../utils';

type GetRefundAddressProps = {
    account: Account;
};

type GetRefundAddressFulfillValue = {
    address: string;
    mac: string;
    path: string;
};

export const getRefundAddress = createThunk<
    GetRefundAddressFulfillValue,
    GetRefundAddressProps,
    {
        rejectValue: TradingSendRejectedProps;
    }
>(
    `${TRADING_THUNK_PREFIX}/getRefundAddress`,
    async ({ account }, { getState, dispatch, rejectWithValue, fulfillWithValue }) => {
        const { path } = getUnusedAddressFromAccount(account);
        const addressDisplayType = selectAddressDisplayType(getState());

        if (!path) {
            return rejectWithValue({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_VERIFY_ERROR',
                },
            });
        }

        const params: Parameters<typeof confirmAddressOnDeviceThunk>[0] = {
            accountKey: account.key,
            addressPath: path,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
            showOnTrezor: false,
        };

        const refund = await dispatch(confirmAddressOnDeviceThunk(params)).unwrap();

        if (!refund.success) {
            return rejectWithValue({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_VERIFY_ERROR',
                },
            });
        }

        if (!('mac' in refund.payload) || !refund.payload.mac) {
            return rejectWithValue({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_VERIFY_ERROR',
                },
            });
        }

        return fulfillWithValue({
            address: refund.payload.address,
            mac: refund.payload.mac,
            path: params.addressPath,
        });
    },
);
