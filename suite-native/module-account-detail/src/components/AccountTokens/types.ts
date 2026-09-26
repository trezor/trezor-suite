import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';

export type { AccountTokensFlow, AccountTokensTab } from '@suite-native/navigation';

export type OnSelectAsset = (params: {
    tokenContract?: TokenAddress;
    tokenSymbol?: TokenSymbol;
}) => void;
