import { type TokenAddress, type TokenSymbol } from '@suite-common/tokens';
import { type Account } from '@suite-common/wallet-types';

export type OnSelectAccount = (params: {
    account: Account;
    // if clicked item is staking item
    isStaking?: boolean;
    tokenAddress?: TokenAddress;
    tokenSymbol?: TokenSymbol;
    hasAnyKnownTokens: boolean;
}) => void;

export type NetworkFilterType = 'all' | 'accounts' | 'send';
