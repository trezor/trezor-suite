import { AssetSymbol } from '@suite/assets';
import { type AssetDiffTransferLabel } from '@suite-common/tx-simulation';
import { type NetworkSymbol } from '@suite-common/wallet-config';

type TxSimulationAssetDiffLabelProps = {
    label: AssetDiffTransferLabel;
    networkSymbol: NetworkSymbol;
};

export const TxSimulationAssetDiffLabel = ({
    label: { amount, assetSymbol },
    networkSymbol,
}: TxSimulationAssetDiffLabelProps) => (
    <>
        {amount !== null && `${amount} `}
        {assetSymbol ?? <AssetSymbol networkSymbol={networkSymbol} />}
    </>
);
