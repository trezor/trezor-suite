import { Translation } from '@suite/intl';
import { TokenName } from '@suite/token';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
} from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { type WalletAssetKey } from '@suite-common/wallet-core';

import { useSelector } from '#src/hooks/suite';

type AssetDetailAssetDescriptionProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailAssetDescription = ({ assetKey }: AssetDetailAssetDescriptionProps) => {
    const { NetworkNameFormatter } = useFormatters();
    const networkSymbol = useSelector(state => selectWalletAssetNetworkSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));

    if (networkSymbol === undefined) {
        return null;
    }

    const networkName = <NetworkNameFormatter value={networkSymbol} />;

    if (contractAddress === undefined) {
        return networkName;
    }

    return (
        <Translation
            id="TR_GLOBAL_RECEIVE_ASSET_ON_NETWORK"
            values={{
                asset: <TokenName networkSymbol={networkSymbol} tokenContract={contractAddress} />,
                network: networkName,
            }}
        />
    );
};
