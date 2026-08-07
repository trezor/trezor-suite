import {
    type NetworkSymbol,
    type NetworkType,
    getWrappedNativeAddress,
    isWrappedNativeToken,
} from '@suite-common/wallet-config';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';

type WrappedNativeTokenEntry = {
    isDisabled: boolean;
    isDisplayed: boolean;
};

type GetWrappedNativeTokenEntriesParams = {
    isDebugEnvironment: boolean;
    isPortfolioTrackerDevice: boolean;
    isUnwrapDisabled: boolean;
    isWrapDisabled: boolean;
    networkType: NetworkType;
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const getWrappedNativeTokenEntries = ({
    isDebugEnvironment,
    isPortfolioTrackerDevice,
    isUnwrapDisabled,
    isWrapDisabled,
    networkType,
    symbol,
    tokenContract,
}: GetWrappedNativeTokenEntriesParams): Record<WrappedNativeFlowType, WrappedNativeTokenEntry> => {
    const isEthereumAccount = !isPortfolioTrackerDevice && networkType === 'ethereum';

    return {
        wrap: {
            isDisabled: isWrapDisabled,
            isDisplayed:
                isDebugEnvironment &&
                isEthereumAccount &&
                !tokenContract &&
                !!getWrappedNativeAddress(symbol),
        },
        unwrap: {
            isDisabled: isUnwrapDisabled,
            isDisplayed: isEthereumAccount && isWrappedNativeToken(symbol, tokenContract),
        },
    };
};
