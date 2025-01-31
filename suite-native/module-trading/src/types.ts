import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';

// NOTE: in production code we probably want to use `TokenInfoBranded` or something similar instead
export type TradeableAsset = {
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    name?: string;
};
