import { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import {
    type TradingAssetSellOption,
    createAssetNativeTokenOption,
    useTradingAssets,
} from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';

import { type AssetPickerListItem } from 'src/components/suite/asset-picker/hooks';

export interface UseUpdateFormInputProps {
    closeModal: () => void;
    onAssetSelect: (asset: TradingAssetSellOption) => void;
}

export function useUpdateFormInput({ closeModal, onAssetSelect }: UseUpdateFormInputProps) {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { resolveAssetTokenOption } = useTradingAssets();

    const handleAssetClick = useCallback(
        (asset: AssetPickerListItem) => {
            switch (asset.type) {
                case 'account': {
                    onAssetSelect({
                        ...createAssetNativeTokenOption(
                            networkConfigDeps,
                            asset.account.symbol as NetworkSymbol,
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
