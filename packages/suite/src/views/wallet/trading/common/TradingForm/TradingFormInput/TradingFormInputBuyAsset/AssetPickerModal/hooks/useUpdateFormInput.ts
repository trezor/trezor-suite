import { useCallback } from 'react';

import {
    type TradingAssetOption,
    createAssetNativeTokenOption,
    useTradingAssets,
} from '@suite-common/trading';
import { type NetworkConfigWithoutTestnets } from '@suite-common/wallet-config';

import { type TradingAssetListItem } from './useBuildTradingAssetOptions';

export interface UseUpdateFormInputProps {
    closeModal: () => void;
    onAssetSelect: (asset: TradingAssetOption) => void;
}

export function useUpdateFormInput({ closeModal, onAssetSelect }: UseUpdateFormInputProps) {
    const { resolveAssetTokenOption } = useTradingAssets();

    const handleAssetClick = useCallback(
        (asset: TradingAssetListItem) => {
            switch (asset.type) {
                case 'account': {
                    onAssetSelect(
                        createAssetNativeTokenOption(
                            asset.account.symbol as NetworkConfigWithoutTestnets['symbol'],
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
