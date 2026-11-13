import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';

export type SignVerifyRootState = DeviceRootState;

export type StateParams = {
    device: TrezorDevice;
    account: Account;
    coin: Account['symbol'];
};

export const getStateParams = (
    account: Account,
    getState: () => SignVerifyRootState,
): Promise<StateParams> => {
    const device = selectSelectedDevice(getState());

    return !device || !device.connected || !device.available
        ? Promise.reject(new Error('Device not found'))
        : Promise.resolve({
              device,
              account,
              coin: account.symbol,
          });
};
