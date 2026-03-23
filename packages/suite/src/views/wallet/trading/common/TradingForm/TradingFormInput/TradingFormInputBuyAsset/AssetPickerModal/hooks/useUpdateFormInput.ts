import { useCallback } from 'react';

import {
    type TradingAssetOption,
    createAssetNativeTokenOption,
    createAssetTokenOption,
} from '@suite-common/trading';
import { type NetworkConfigWithoutTestnets } from '@suite-common/wallet-config';

import { type TradingAssetListItem } from './useBuildTradingAssetOptions';

export interface UseUpdateFormInputProps {
    closeModal: () => void;
    onAssetSelect: (asset: TradingAssetOption) => void;
}

export function useUpdateFormInput({ closeModal, onAssetSelect }: UseUpdateFormInputProps) {
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
                    onAssetSelect(createAssetTokenOption(asset.account.symbol, asset.token));
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
