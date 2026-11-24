import { useSelector } from 'react-redux';

import { type AssetId, parseAssetId } from '@suite-common/assets';
import { type NetworksRootState, selectNetworkDisplaySymbol } from '@suite-common/networks';
import { Text, type TextProps } from '@suite-native/atoms';
import { TokenSymbol } from '@suite-native/tokens';

type AssetSymbolProps = Omit<TextProps, 'children'> & {
    assetId: AssetId;
    isTruncated?: boolean;
};

/** The symbol of a coin or a token; an unrecognized token's symbol has its URLs masked. */
export const AssetSymbol = ({ assetId, isTruncated, ...textProps }: AssetSymbolProps) => {
    const { networkSymbol, contractAddress } = parseAssetId(assetId);
    const networkDisplaySymbol = useSelector((state: NetworksRootState) =>
        selectNetworkDisplaySymbol(state, networkSymbol),
    );

    return contractAddress ? (
        <TokenSymbol
            {...textProps}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            isTruncated={isTruncated}
        />
    ) : (
        <Text {...textProps}>{networkDisplaySymbol}</Text>
    );
};
