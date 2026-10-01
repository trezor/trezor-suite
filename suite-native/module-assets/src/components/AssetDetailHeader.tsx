import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';

import { AssetDetailPriceSection } from './AssetDetailPriceSection';

type AssetDetailHeaderProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const AssetDetailHeader = ({ networkSymbol, tokenContract }: AssetDetailHeaderProps) => (
    <AssetDetailPriceSection networkSymbol={networkSymbol} tokenContract={tokenContract} />
);
