import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigDeps } from '@suite-common/networks';
import { getDisplaySymbol } from '@suite-common/wallet-config';

import { type ExchangeInfoAsset } from './notificationsTypes';
import { TokenIcon } from '../TokenIcon/TokenIcon';

type ExchangeAssetWithFallbackProps = {
    asset: ExchangeInfoAsset;
};

export const ExchangeAssetWithFallback = ({ asset }: ExchangeAssetWithFallbackProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const resolvedDisplaySymbol =
        asset.displaySymbol ?? getDisplaySymbol(networkConfigDeps, asset.symbol);

    return (
        asset.icon ?? (
            <TokenIcon
                size={20}
                contractAddress={asset.contractAddress}
                symbol={asset.symbol}
                placeholder={resolvedDisplaySymbol}
            />
        )
    );
};
