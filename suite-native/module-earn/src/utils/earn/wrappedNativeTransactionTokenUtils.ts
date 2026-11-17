import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { getWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

/**
 * The token a wrap or unwrap transaction spends, as its review describes it: a wrap spends the
 * native coin, so it has none; an unwrap spends the wrapped native token.
 */
export const getWrappedNativeTransactionToken = (
    networkSymbol: NetworkSymbol,
    flowType: WrappedNativeFlowType,
) => {
    const wrappedNative = getWrappedNativeToken(networkSymbol);

    if (flowType === 'wrap' || !wrappedNative) {
        return undefined;
    }

    return {
        contractAddress: wrappedNative.address,
        symbol: wrappedNative.symbol,
        decimals: wrappedNative.decimals,
    };
};
