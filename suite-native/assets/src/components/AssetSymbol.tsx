import { useSelector } from 'react-redux';

import { type NetworksRootState, selectNetworkDisplaySymbol } from '@suite-common/networks';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Text, type TextProps } from '@suite-native/atoms';
import { TokenSymbol } from '@suite-native/tokens';

type AssetSymbolProps = Omit<TextProps, 'children'> & {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    isTruncated?: boolean;
};

/** The symbol of a coin or a token; an unrecognized token's symbol has its URLs masked. */
export const AssetSymbol = ({
    networkSymbol,
    contractAddress,
    isTruncated,
    ...textProps
}: AssetSymbolProps) => {
    const networkDisplaySymbol = useSelector((state: NetworksRootState) =>
        selectNetworkDisplaySymbol(state, networkSymbol),
    );

    if (contractAddress) {
        return (
            <TokenSymbol
                {...textProps}
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
                isTruncated={isTruncated}
            />
        );
    }

    return <Text {...textProps}>{networkDisplaySymbol}</Text>;
};
