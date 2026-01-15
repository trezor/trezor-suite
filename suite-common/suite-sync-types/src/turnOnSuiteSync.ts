import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';

import { SuiteSyncUnavailableOnDeviceErrorType } from './refreshSuiteSyncKeys';

type TurnOnSuiteSyncParams = {
    onError: (params: {
        deviceStaticSessionId: StaticSessionId;
        error: SuiteSyncUnavailableOnDeviceErrorType | DeviceErrorType | DeviceCancelledErrType;
    }) => void;
};

export type TurnOnSuiteSync = (params: TurnOnSuiteSyncParams) => void;

export type TurnOnSuiteSyncDep = { turnOnSuiteSync: TurnOnSuiteSync };
