import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

export type FiatRateKey = string & { __type: 'FiatRateKey' };

export interface TickerId {
    symbol: TokenSymbol | NetworkSymbol;
    mainNetworkSymbol?: NetworkSymbol; // symbol of thee main network. (used for tokens)
    tokenAddress?: TokenAddress;
}
