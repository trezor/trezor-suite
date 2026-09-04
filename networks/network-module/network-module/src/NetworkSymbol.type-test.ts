import type { NetworkSymbol } from './NetworkSymbol';

declare const networkSymbol: NetworkSymbol;
declare const plainString: string;

const plainStringFromNetworkSymbol: string = networkSymbol;

// @ts-expect-error An unchecked string is not a network symbol.
const networkSymbolFromPlainString: NetworkSymbol = plainString;

void plainStringFromNetworkSymbol;
void networkSymbolFromPlainString;
