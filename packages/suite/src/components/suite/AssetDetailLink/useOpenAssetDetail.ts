import { gotoThunk } from '@suite/router';
import { selectWalletAssetKey, selectWalletAssetSymbol } from '@suite-common/assets';
import { ExperimentId, useIsExperimentVariantActive } from '@suite-common/message-system';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

type UseOpenAssetDetailParams = {
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
};

export const useOpenAssetDetail = ({
    symbol,
    contractAddress,
}: UseOpenAssetDetailParams): (() => void) | undefined => {
    const { dispatch } = useServices(injectDispatch);
    const isAssetDetailEnabled = useIsExperimentVariantActive({
        experimentId: ExperimentId.assetFirstHomeTable,
        variant: 'B',
    });
    const assetKey = useSelector(state => selectWalletAssetKey(state, symbol, contractAddress));
    const isAssetDetailAvailable = useSelector(
        state => selectWalletAssetSymbol(state, assetKey) !== undefined,
    );

    if (!isAssetDetailEnabled || !isAssetDetailAvailable) {
        return undefined;
    }

    return () =>
        dispatch(gotoThunk({ routeName: 'suite-asset', params: { symbol, contractAddress } }));
};
