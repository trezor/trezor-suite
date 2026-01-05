import { useCallback } from 'react';

import { TradingAssetOption, getCryptoId } from '@suite-common/trading';
import {
    NetworkConfigWithoutTestnets,
    getDisplaySymbol,
    networks,
} from '@suite-common/wallet-config';

import { TradingAssetListItem } from './useBuildTradingAssetOptions';

export interface UseUpdateFormInputProps {
    closeModal: () => void;
    onAssetSelect: (asset: TradingAssetOption) => void;
}

export function useUpdateFormInput({ closeModal, onAssetSelect }: UseUpdateFormInputProps) {
    const handleAssetClick = useCallback(
        (asset: TradingAssetListItem) => {
            switch (asset.type) {
                case 'account': {
                    const network = networks[asset.account.symbol] as NetworkConfigWithoutTestnets;

                    onAssetSelect({
                        id: getCryptoId(asset.account),
                        coingeckoId: network.coingeckoId!,

                        isNativeToken: true,

                        symbol: network.symbol,
                        displaySymbol: network.displaySymbol,
                        name: network.name,
                        contractAddress: null,

                        networkName: network.name,
                        networkSymbol: network.symbol,
                    });
                    break;
                }

                case 'token': {
                    const network = networks[asset.account.symbol];

                    onAssetSelect({
                        id: getCryptoId(asset.account, asset.token),
                        coingeckoId: network.coingeckoId!,

                        isNativeToken: false,

                        contractAddress: asset.token.contract,
                        symbol: asset.token.symbol!,
                        name: asset.token.name!,
                        displaySymbol: getDisplaySymbol(asset.token.symbol!, asset.token.contract),

                        networkSymbol: asset.account.symbol,
                        networkName: network.name,
                    });
                    break;
                }
                case 'asset': {
                    onAssetSelect(asset.asset);
                    break;
                }
            }

            closeModal();
        },
        [closeModal, onAssetSelect],
    );

    return handleAssetClick;
}
