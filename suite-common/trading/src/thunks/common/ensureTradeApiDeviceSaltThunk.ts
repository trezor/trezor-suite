import {
    type DeviceRootState,
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectDeviceByStaticSessionId,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    type DiscoveryRootState,
    isDiscoveryInProgress,
    selectDiscoveryByDevicePath,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';

import { TRADE_API_DEVICE_SALT_CIPHER_PARAMS, TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingRootState, tradingActions } from '../../reducers/tradingCommonReducer';
import { selectTradeApiDeviceSalt } from '../../selectors/tradingSelectors';
import { deriveTradeApiDeviceSalt } from '../../utils/tradeApiSaltUtils';

type EnsureTradeApiDeviceSaltThunkParams = {
    account: Pick<Account, 'deviceState'>;
};

export type EnsureTradeApiDeviceSaltThunkState = DeviceRootState &
    DiscoveryRootState &
    TradingRootState;

export const ensureTradeApiDeviceSaltThunk = createThunk<
    void,
    EnsureTradeApiDeviceSaltThunkParams,
    { state: EnsureTradeApiDeviceSaltThunkState }
>(
    `${TRADING_THUNK_PREFIX}/ensureTradeApiDeviceSalt`,
    async ({ account }, { dispatch, getState }) => {
        const staticSessionId = account.deviceState;

        if (selectTradeApiDeviceSalt(getState(), staticSessionId)) {
            return;
        }

        const device = selectDeviceByStaticSessionId(getState(), staticSessionId);

        if (
            !device?.connected ||
            device.features?.unlocked === false ||
            selectSelectedDevice(getState())?.state?.staticSessionId !== staticSessionId ||
            device.id === PORTFOLIO_TRACKER_DEVICE_ID ||
            isDiscoveryInProgress(selectDiscoveryByDevicePath(getState(), device.path))
        ) {
            return;
        }

        const response = await TrezorConnect.cipherKeyValue({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            ...TRADE_API_DEVICE_SALT_CIPHER_PARAMS,
        });

        if (!response.success) {
            return;
        }

        const currentDevice = selectDeviceByStaticSessionId(getState(), staticSessionId);

        if (!currentDevice) {
            return;
        }

        dispatch(
            tradingActions.setTradeApiDeviceSalt({
                staticSessionId,
                salt: deriveTradeApiDeviceSalt(response.payload.value),
                isRemembered: !!currentDevice.remember && !currentDevice.temporaryRemember,
            }),
        );
    },
);
