import { useCallback } from 'react';

import {
    type TradingAssetSellOption,
    createAssetNativeTokenOption,
    useTradingAssets,
} from '@suite-common/trading';
import { type NetworkConfigWithoutTestnets } from '@suite-common/wallet-config';

import { type AssetPickerListItem } from 'src/components/suite/asset-picker/hooks';

export interface UseUpdateFormInputProps {
    closeModal: () => void;
    onAssetSelect: (asset: TradingAssetSellOption) => void;
}

export function useUpdateFormInput({ closeModal, onAssetSelect }: UseUpdateFormInputProps) {
    const { resolveAssetTokenOption } = useTradingAssets();

    const handleAssetClick = useCallback(
        (asset: AssetPickerListItem) => {
            switch (asset.type) {
                case 'account': {
                    onAssetSelect({
                        ...createAssetNativeTokenOption(
                            asset.account.symbol as NetworkConfigWithoutTestnets['symbol'],
                        ),
                        accountKey: asset.account.key,
                    });
                    break;
                }

                case 'token': {
                    onAssetSelect({
                        ...resolveAssetTokenOption(asset.account.symbol, asset.token),
                        accountKey: asset.account.key,
                    });
                    break;
                }
            }

            closeModal();
        },
        [closeModal, onAssetSelect, resolveAssetTokenOption],
    );

    return handleAssetClick;
}
