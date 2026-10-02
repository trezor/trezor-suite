import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import {
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
    getWrappedNativeToken,
    isWrappedNativeToken,
} from './wrappedNativeToken';

declare const networkSymbol: NetworkSymbol;

getWrappedNativeToken(networkSymbol);
getWrappedNativeAddress(networkSymbol);
getWrappedNativeSymbol(networkSymbol);
isWrappedNativeToken(networkSymbol);
getWrappedNativeToken(asNetworkSymbol('unknown'));

// @ts-expect-error Shared helpers require a branded network symbol.
getWrappedNativeToken('eth');
// @ts-expect-error Shared helpers require a branded network symbol.
getWrappedNativeAddress('eth');
// @ts-expect-error Shared helpers require a branded network symbol.
getWrappedNativeSymbol('eth');
// @ts-expect-error Shared helpers require a branded network symbol.
isWrappedNativeToken('eth');
