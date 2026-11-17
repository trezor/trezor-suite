import { useSelector } from 'react-redux';

import {
    type NetworksRootState,
    injectIsWrappedNativeToken,
    selectNetworkDisplaySymbol,
} from '@suite-common/networks';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Text, type TextProps } from '@suite-native/atoms';
import { TokenSymbol } from '@suite-native/tokens';
import { useServices } from '@trezor/dependency-injection';

type AssetSymbolProps = Omit<TextProps, 'children'> & {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    isTruncated?: boolean;
    /** Shows the network's wrapped native token (e.g. WETH) as its native coin (ETH). */
    isWrappedNativeShownAsNative?: boolean;
};

type WrappedNativeAwareSymbolProps = Omit<TextProps, 'children'> & {
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
    ...textProps
}: WrappedNativeAwareSymbolProps) => {
    const { isWrappedNativeToken } = useServices(injectIsWrappedNativeToken);

    if (isWrappedNativeToken(networkSymbol, contractAddress)) {
        return <Text {...textProps}>{networkDisplaySymbol}</Text>;
    }

    return (
        <TokenSymbol
            {...textProps}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
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
    ...textProps
}: AssetSymbolProps) => {
    const networkDisplaySymbol = useSelector((state: NetworksRootState) =>
        selectNetworkDisplaySymbol(state, networkSymbol),
    );

    if (!contractAddress) {
        return <Text {...textProps}>{networkDisplaySymbol}</Text>;
    }

    if (isWrappedNativeShownAsNative) {
        return (
            <WrappedNativeAwareSymbol
                {...textProps}
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
                isTruncated={isTruncated}
                networkDisplaySymbol={networkDisplaySymbol}
            />
        );
    }

    return (
        <TokenSymbol
            {...textProps}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            isTruncated={isTruncated}
        />
    );
};
