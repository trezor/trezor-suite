import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import TrezorConnect from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingError } from '../../types';
import { getConnectErrorCause } from '../../utils/tradingErrorUtils';

export type GetNonceThunkState = DeviceRootState;

export const getNonceThunk = createThunk<
    string,
    void,
    { rejectValue: TradingError; state: GetNonceThunkState }
>(
    `${TRADING_THUNK_PREFIX}/getNonce`,
    async (_, { getState, rejectWithValue, fulfillWithValue }) => {
        const device = selectSelectedDevice(getState());

        if (!device) {
            return rejectWithValue({
                type: 'sign-tx-error',
                code: 'device-not-connected',
            });
        }

        const nonceResponse = await TrezorConnect.getNonce({ device, keepSession: true });

        if (!nonceResponse.success) {
            return rejectWithValue({
                type: 'sign-tx-error',
                code: 'nonce-failed',
                cause: getConnectErrorCause(nonceResponse.error),
            });
        }

        return fulfillWithValue(nonceResponse.payload.nonce);
    },
);
