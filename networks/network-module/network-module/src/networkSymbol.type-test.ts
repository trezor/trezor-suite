import { type NetworkSymbol, asNetworkSymbol } from './networkSymbol';

const supportedSymbols = [asNetworkSymbol('aaa'), asNetworkSymbol('taaa')] as const;
type SupportedSymbol = (typeof supportedSymbols)[number];

const supported: SupportedSymbol = asNetworkSymbol('aaa');
// @ts-expect-error Branding must preserve literals so lists reject other networks.
const unsupported: SupportedSymbol = asNetworkSymbol('zzz');

declare const dynamicSymbol: string;
const openSymbol: NetworkSymbol = asNetworkSymbol(dynamicSymbol);

void supported;
void supportedSymbols;
void unsupported;
void openSymbol;
