import { useSelector } from 'react-redux';

import type { NetworkConfigState } from '@trezor/network-module-types';

import { type ExchangeInfoAsset } from './notificationsTypes';
import { selectDisplaySymbol } from '../../network-display/networkDisplaySelectors';
import { TokenIcon } from '../TokenIcon/TokenIcon';

type ExchangeAssetWithFallbackProps = {
    asset: ExchangeInfoAsset;
};

export const ExchangeAssetWithFallback = ({ asset }: ExchangeAssetWithFallbackProps) => {
    const resolvedDisplaySymbol = useSelector(
        (state: NetworkConfigState) =>
            asset.displaySymbol ?? selectDisplaySymbol(state, asset.symbol),
    );

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
