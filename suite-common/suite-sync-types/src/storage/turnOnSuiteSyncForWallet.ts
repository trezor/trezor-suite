import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { RefreshSuiteKeysUnavailable } from '../refreshSuiteSyncKeys';

export type TurnOnSuiteSyncForWalletParams = { deviceStaticSessionId: StaticSessionId };

export type TurnOnSuiteSyncForWallet = (
    params: TurnOnSuiteSyncForWalletParams,
) => Promise<Result<void, RefreshSuiteKeysUnavailable | DeviceErrorType | DeviceCancelledErrType>>;

export type TurnOnSuiteSyncForWalletDep = {
    turnOnSuiteSyncForWallet: TurnOnSuiteSyncForWallet;
};
