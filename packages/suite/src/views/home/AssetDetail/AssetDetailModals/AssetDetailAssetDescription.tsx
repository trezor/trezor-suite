import { Translation } from '@suite/intl';
import { TokenName } from '@suite/token';
import { selectWalletAssetContractAddress, selectWalletAssetSymbol } from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { type WalletAssetKey } from '@suite-common/wallet-core';

import { useSelector } from '#src/hooks/suite';

type AssetDetailAssetDescriptionProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailAssetDescription = ({ assetKey }: AssetDetailAssetDescriptionProps) => {
    const { NetworkNameFormatter } = useFormatters();
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));

    if (symbol === undefined) {
        return null;
    }

    const networkName = <NetworkNameFormatter value={symbol} />;

    if (contractAddress === undefined) {
        return networkName;
    }

    return (
        <Translation
            id="TR_GLOBAL_RECEIVE_ASSET_ON_NETWORK"
            values={{
                asset: <TokenName networkSymbol={symbol} tokenContract={contractAddress} />,
                network: networkName,
            }}
        />
    );
};
