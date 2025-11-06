import { getDisplaySymbol } from '@suite-common/wallet-config';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { AssetLogo, type AssetLogoProps } from '@trezor/components';

import { AssetRowAssetDataProps } from '../../constants';

type AssetImageProps = Pick<
    AssetRowAssetDataProps,
    'networkSymbol' | 'coingeckoId' | 'contractAddress' | 'symbol'
> & {
    size?: AssetLogoProps['size'];
};

export function AssetImage({
    coingeckoId,
    contractAddress,
    networkSymbol,
    symbol,
    size = 40,
}: AssetImageProps) {
    return (
        <AssetLogo
            size={size}
            coingeckoId={coingeckoId}
            contractAddress={
                contractAddress
                    ? getContractAddressForNetworkSymbol(networkSymbol, contractAddress)
                    : undefined
            }
            placeholder={getDisplaySymbol(symbol, contractAddress)}
        />
    );
}
