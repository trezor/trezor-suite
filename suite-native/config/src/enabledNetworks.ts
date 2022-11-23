import { networks, NetworkSymbol } from '@suite-common/wallet-config';

export const enabledNetworks: NetworkSymbol[] = Object.keys(networks) as NetworkSymbol[];
