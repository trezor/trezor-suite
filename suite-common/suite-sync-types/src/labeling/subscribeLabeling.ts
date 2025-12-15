import type { SuiteSyncOwner } from '@suite-common/suite-types';
import type { WalletDescriptor } from '@suite-common/wallet-types';

type SubscribeLabelingParams = {
    owner: SuiteSyncOwner;
    walletDescriptor: WalletDescriptor;
};

export type SubscribeLabeling = (params: SubscribeLabelingParams) => void;
