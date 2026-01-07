import { SuiteSyncSchema } from '@suite-common/suite-sync-storage';
import {
    DeviceCancelledErrType,
    DeviceErrorType,
    WalletDescriptor,
} from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { RefreshSuiteKeysUnavailableType } from '../refreshSuiteSyncKeys';

type SubscribeSuiteSyncDataParams = {
    deviceStaticSessionId: StaticSessionId;
};

export type Subscriptions = {
    [K in keyof SuiteSyncSchema]: (
        deviceStaticSessionId: StaticSessionId,
        entity: SuiteSyncSchema[K][],
    ) => void;
};

export type SuiteSyncListener = {
    onEntityChange: Subscriptions;
    onUnsubscribe: ({ walletDescriptor }: { walletDescriptor: WalletDescriptor }) => void;
};

export type SuiteSyncListenerDep = {
    suiteSyncListener: SuiteSyncListener;
};

export type SubscribeSuiteSyncData = (
    params: SubscribeSuiteSyncDataParams,
) => Promise<
    Result<void, RefreshSuiteKeysUnavailableType | DeviceErrorType | DeviceCancelledErrType>
>;

export type SubscribeSuiteSyncDataDep = {
    subscribeSuiteSyncData: SubscribeSuiteSyncData;
};
