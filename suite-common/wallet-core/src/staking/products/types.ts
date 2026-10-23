import {
    type StakingNetworkType,
    type StakingProductIdentityType,
} from '@suite-common/wallet-config';
import { type Account, type StakingLimits } from '@suite-common/wallet-types';

import { type StakingPosition } from '../positions/positionsTypes';

// The business logic of the products sharing one chain identity type; network-specific adapter
// contracts extend it.
export type StakingProductAdapterBase<TNetworkType extends StakingNetworkType> = {
    readonly networkType: TNetworkType;
    readonly identityType: StakingProductIdentityType;
    readonly limits: StakingLimits;
    /** Splits the account's stake across the adapter's products, so the positions sum up to it. */
    derivePositions: (account: Account) => StakingPosition[];
};
