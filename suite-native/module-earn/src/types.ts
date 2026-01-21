import { StakingNetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

export type EarnItem = {
    symbol: StakingNetworkSymbol;
    accountKey: Account['key'];
    accountLabel?: Account['accountLabel'];
};
