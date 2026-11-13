import { type EvmAssetDiff, getEvmAssetDiffValue } from '@suite-common/tx-simulation';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { AssetValue } from '@suite-native/assets';
import { type TextProps } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

const TRANSFER_MESSAGE_ID = {
    in: 'moduleConnectPopup.simulation.receivingAsset',
    out: 'moduleConnectPopup.simulation.sendingAsset',
} as const;

type EvmTxSimulationSummaryProps = {
    assetDiff?: EvmAssetDiff;
    transfer: EvmAssetDiff['in'][number];
    networkSymbol: NetworkSymbol;
    direction: keyof typeof TRANSFER_MESSAGE_ID;
    color: TextProps['color'];
};

/** A transfer's amount and asset; one without a fungible amount keeps the provider's summary. */
export const EvmTxSimulationSummary = ({
    assetDiff,
    transfer,
    networkSymbol,
    direction,
    color,
}: EvmTxSimulationSummaryProps) => {
    const value = assetDiff ? getEvmAssetDiffValue(assetDiff.asset, transfer) : null;

    if (!value) {
        return transfer.summary;
    }

    return (
        <Translation
            id={TRANSFER_MESSAGE_ID[direction]}
            values={{
                amount: <AssetValue {...value} networkSymbol={networkSymbol} color={color} />,
            }}
        />
    );
};
