import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { RefreshSuiteKeysUnavailableType } from '../refreshSuiteSyncKeys';

type SubscribeLabelingParams = {
    deviceStaticSessionId: StaticSessionId;
};

export type SubscribeLabeling = (
    params: SubscribeLabelingParams,
) => Promise<
    Result<void, RefreshSuiteKeysUnavailableType | DeviceErrorType | DeviceCancelledErrType>
>;
