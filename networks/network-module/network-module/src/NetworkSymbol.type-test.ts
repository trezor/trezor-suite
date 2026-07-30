import type { NetworkSymbol, NetworkSymbolNonTestnet } from './NetworkSymbol';

declare const networkSymbol: NetworkSymbol;
declare const networkSymbolNonTestnet: NetworkSymbolNonTestnet;

const networkSymbolFromNonTestnet: NetworkSymbol = networkSymbolNonTestnet;

// @ts-expect-error A general network symbol is not guaranteed to represent a non-testnet network.
const networkSymbolNonTestnetFromNetwork: NetworkSymbolNonTestnet = networkSymbol;

void networkSymbolFromNonTestnet;
void networkSymbolNonTestnetFromNetwork;
