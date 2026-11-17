import { useSelector } from 'react-redux';

import { TokenSymbol } from '@suite/token';
import {
    type NetworksRootState,
    injectIsWrappedNativeToken,
    selectNetworkDisplaySymbol,
} from '@suite-common/networks';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useServices } from '@trezor/dependency-injection';

type AssetSymbolProps = {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    isTruncated?: boolean;
    /** Shows the network's wrapped native token (e.g. WETH) as its native coin (ETH). */
    isWrappedNativeShownAsNative?: boolean;
};

type WrappedNativeAwareSymbolProps = {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    isTruncated?: boolean;
    networkDisplaySymbol: string | undefined;
};

// Only the opted-in symbols need the network services.
const WrappedNativeAwareSymbol = ({
    networkSymbol,
    contractAddress,
    isTruncated,
    networkDisplaySymbol,
}: WrappedNativeAwareSymbolProps) => {
    const { isWrappedNativeToken } = useServices(injectIsWrappedNativeToken);

    if (isWrappedNativeToken(networkSymbol, contractAddress)) {
        return networkDisplaySymbol ?? null;
    }

    return (
        <TokenSymbol
            networkSymbol={networkSymbol}
            tokenContract={contractAddress}
            isTruncated={isTruncated}
        />
    );
};

/** The symbol of a coin or a token; an unrecognized token's symbol has its URLs masked. */
export const AssetSymbol = ({
    networkSymbol,
    contractAddress,
    isTruncated,
    isWrappedNativeShownAsNative = false,
}: AssetSymbolProps) => {
    const networkDisplaySymbol = useSelector((state: NetworksRootState) =>
        selectNetworkDisplaySymbol(state, networkSymbol),
    );

    if (!contractAddress) {
        return networkDisplaySymbol ?? null;
    }

    if (isWrappedNativeShownAsNative) {
        return (
            <WrappedNativeAwareSymbol
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
                isTruncated={isTruncated}
                networkDisplaySymbol={networkDisplaySymbol}
            />
        );
    }

    return (
        <TokenSymbol
            networkSymbol={networkSymbol}
            tokenContract={contractAddress}
            isTruncated={isTruncated}
        />
    );
};
