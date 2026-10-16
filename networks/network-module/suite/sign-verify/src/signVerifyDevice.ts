import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type WalletSettingsRootState, selectAddressDisplayType } from '@suite-common/wallet-core';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';

export type SignVerifyRootState = DeviceRootState & WalletSettingsRootState;

export type SignVerifyStateParams = {
    device: TrezorDevice;
    account: Account;
    coin: Account['symbol'];
    chunkify?: boolean;
};

export const getSignVerifyStateParams = (
    account: Account,
    getState: () => SignVerifyRootState,
): Promise<SignVerifyStateParams> => {
    const device = selectSelectedDevice(getState());
    const addressDisplayType = selectAddressDisplayType(getState());

    return !device || !device.connected || !device.available
        ? Promise.reject(new Error('Device not found'))
        : Promise.resolve({
              device,
              account,
              coin: account.symbol,
              chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
          });
};
