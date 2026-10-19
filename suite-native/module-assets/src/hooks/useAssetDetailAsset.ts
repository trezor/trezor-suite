import { useSelector } from 'react-redux';

import {
    type HomeAssetTableState,
    selectWalletAssetContractAddress,
    selectWalletAssetSymbol,
} from '@suite-common/assets';

import { useAssetDetailRouteParams } from './useAssetDetailRouteParams';

export const useAssetDetailAsset = () => {
    const { assetKey } = useAssetDetailRouteParams();
    const networkSymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetSymbol(state, assetKey),
    );
    const tokenContract = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetContractAddress(state, assetKey),
    );

    return { assetKey, networkSymbol, tokenContract };
};
