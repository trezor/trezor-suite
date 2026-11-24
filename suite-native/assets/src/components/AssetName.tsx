import { type AssetId, parseAssetId } from '@suite-common/asset-types';
import { type TextProps } from '@suite-native/atoms';
import { TokenName } from '@suite-native/tokens';

import { NativeTokenName } from './NativeTokenName';

type AssetNameProps = Omit<TextProps, 'children'> & { assetId: AssetId };

/** The name of a native token or a token; an unrecognized token's name has its URLs masked. */
export const AssetName = ({ assetId, ...textProps }: AssetNameProps) => {
    const { networkSymbol, contractAddress } = parseAssetId(assetId);

    return contractAddress ? (
        <TokenName {...textProps} networkSymbol={networkSymbol} contractAddress={contractAddress} />
    ) : (
        <NativeTokenName {...textProps} networkSymbol={networkSymbol} />
    );
};
