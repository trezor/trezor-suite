import { type AssetId, parseAssetId } from '@suite-common/assets';
import { useTokenMetadata } from '@suite-common/token';
import { TokenIcon, type TokenIconProps } from '@trezor/product-components';

type AssetIconProps = Omit<
    TokenIconProps,
    'networkSymbol' | 'contractAddress' | 'placeholder' | 'placeholderWithTooltip'
> & { assetId: AssetId };

/** The icon of a native token or a token; a token without a logo shows the first letter of its symbol. */
export const AssetIcon = ({ assetId, ...props }: AssetIconProps) => {
    const { networkSymbol, contractAddress } = parseAssetId(assetId);
    const token = useTokenMetadata(networkSymbol, contractAddress);

    return (
        <TokenIcon
            {...props}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            // Only the first letter, and no tooltip: the whole symbol could carry a URL unmasked.
            placeholder={token?.symbol?.charAt(0)}
            placeholderWithTooltip={false}
        />
    );
};
