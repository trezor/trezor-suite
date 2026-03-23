import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect from '@trezor/connect';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingSendRejectedProps } from '../../types';

export const getNonce = createThunk<string, void, { rejectValue: TradingSendRejectedProps }>(
    `${TRADING_THUNK_PREFIX}/getNonce`,
    async (_, { getState, rejectWithValue, fulfillWithValue }) => {
        const device = selectSelectedDevice(getState());

        if (!device) {
            return rejectWithValue({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_DEVICE_NOT_CONNECTED',
                },
            });
        }

        const nonceResponse = await TrezorConnect.getNonce({ device, keepSession: true });

        if (!nonceResponse.success) {
            return rejectWithValue({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_NONCE_ERROR',
                },
            });
        }

        return fulfillWithValue(nonceResponse.payload.nonce);
    },
);
