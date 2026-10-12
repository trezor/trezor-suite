import { useSelector } from 'react-redux';

import {
    type AssetsRootState,
    selectWalletAssetContractAddress,
    selectWalletAssetSymbol,
} from '@suite-common/assets';

import { useAssetDetailRouteParams } from './useAssetDetailRouteParams';

export const useAssetDetailAsset = () => {
    const { assetKey } = useAssetDetailRouteParams();
    const networkSymbol = useSelector((state: AssetsRootState) =>
        selectWalletAssetSymbol(state, assetKey),
    );
    const tokenContract = useSelector((state: AssetsRootState) =>
        selectWalletAssetContractAddress(state, assetKey),
    );

    return { assetKey, networkSymbol, tokenContract };
};
