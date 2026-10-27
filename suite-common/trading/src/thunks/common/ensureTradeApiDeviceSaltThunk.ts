import { type DeviceRootState, selectDeviceByStaticSessionId } from '@suite-common/device';
import { type EnsureTradeApiDeviceSaltParams } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';

import { TRADE_API_DEVICE_SALT_CIPHER_PARAMS, TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingRootState, tradingActions } from '../../reducers/tradingCommonReducer';
import { selectTradeApiDeviceSalt } from '../../selectors/tradingSelectors';
import { deriveTradeApiDeviceSalt } from '../../utils/tradeApiSaltUtils';

export type EnsureTradeApiDeviceSaltThunkState = DeviceRootState & TradingRootState;

export const ensureTradeApiDeviceSaltThunk = createThunk<
    void,
    EnsureTradeApiDeviceSaltParams,
    { state: EnsureTradeApiDeviceSaltThunkState }
>(
    `${TRADING_THUNK_PREFIX}/ensureTradeApiDeviceSalt`,
    async ({ path, instance, staticSessionId, useEmptyPassphrase }, { dispatch, getState }) => {
        if (selectTradeApiDeviceSalt(getState(), staticSessionId)) {
            return;
        }

        const response = await TrezorConnect.cipherKeyValue({
            device: { path, instance, state: { staticSessionId }, useEmptyPassphrase },
            ...TRADE_API_DEVICE_SALT_CIPHER_PARAMS,
        });

        if (!response.success) {
            return;
        }

        const device = selectDeviceByStaticSessionId(getState(), staticSessionId);

        dispatch(
            tradingActions.setTradeApiDeviceSalt({
                staticSessionId,
                salt: deriveTradeApiDeviceSalt(response.payload.value),
                isRemembered: !!device?.remember && !device.temporaryRemember,
            }),
        );
    },
);
