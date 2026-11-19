import { type AssetDiffTransferLabel } from '@suite-common/tx-simulation';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { AssetSymbol } from '@suite-native/assets';
import { type TextProps } from '@suite-native/atoms';

type TxSimulationAssetDiffLabelProps = {
    label: AssetDiffTransferLabel;
    networkSymbol: NetworkSymbol;
    color: TextProps['color'];
};

export const TxSimulationAssetDiffLabel = ({
    label: { amount, assetSymbol },
    networkSymbol,
    color,
}: TxSimulationAssetDiffLabelProps) => (
    <>
        {amount !== null && `${amount} `}
        {assetSymbol ?? <AssetSymbol networkSymbol={networkSymbol} color={color} />}
    </>
);
