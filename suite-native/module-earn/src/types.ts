import { StakingNetworkSymbol } from '@suite-common/wallet-config';
import { Account, AccountKey } from '@suite-common/wallet-types';

export type EarnItem = {
    symbol: StakingNetworkSymbol;
    accountKey: AccountKey;
    accountLabel?: Account['accountLabel'];
};
