import { Dispatch } from '@reduxjs/toolkit';

import { SuiteSyncOwner } from '@suite-common/suite-types';
import { WalletDescriptor } from '@suite-common/wallet-types';

import { SuiteSyncStorageRepositoryDep } from '../SuiteSyncStorageRepository';
import { SubscriptionStorageDep } from '../storage/subscriptionStorage';

type SubscribeLabelingParams = {
    owner: SuiteSyncOwner;
    walletDescriptor: WalletDescriptor;
};

export type SubscribeLabeling = (params: SubscribeLabelingParams) => void;

export type CreateSubscribeLabelingDeps = SuiteSyncStorageRepositoryDep &
    SubscriptionStorageDep & {
        dispatch: Dispatch;
    };
