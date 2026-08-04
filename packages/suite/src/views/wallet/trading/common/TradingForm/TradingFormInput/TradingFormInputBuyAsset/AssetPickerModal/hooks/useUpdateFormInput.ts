import { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import {
    type TradingAssetOption,
    createAssetNativeTokenOption,
    useTradingAssets,
} from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';

import { type TradingAssetListItem } from './useBuildTradingAssetOptions';

export interface UseUpdateFormInputProps {
    closeModal: () => void;
    onAssetSelect: (asset: TradingAssetOption) => void;
}

export function useUpdateFormInput({ closeModal, onAssetSelect }: UseUpdateFormInputProps) {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { resolveAssetTokenOption } = useTradingAssets();

    const handleAssetClick = useCallback(
        (asset: TradingAssetListItem) => {
            switch (asset.type) {
                case 'account': {
                    onAssetSelect(
                        createAssetNativeTokenOption(
                            networkConfigDeps,
                            asset.account.symbol as NetworkSymbol,
                        ),
                    );
                    break;
                }

                case 'token': {
                    onAssetSelect(resolveAssetTokenOption(asset.account.symbol, asset.token));
                    break;
                }
                case 'asset': {
                    onAssetSelect(asset.asset);
                    break;
                }
            }

            closeModal();
        },
        [closeModal, onAssetSelect, resolveAssetTokenOption],
    );

    return handleAssetClick;
}
