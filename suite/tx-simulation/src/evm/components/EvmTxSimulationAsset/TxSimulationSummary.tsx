import { AssetValue } from '@suite/assets';
import { Translation } from '@suite/intl';
import { type EvmAssetDiff, getEvmAssetDiffValue } from '@suite-common/tx-simulation';
import { type NetworkSymbol } from '@suite-common/wallet-config';

const TRANSFER_MESSAGE_ID = {
    in: 'TR_SIMULATION_RECEIVING_ASSET',
    out: 'TR_SIMULATION_SENDING_ASSET',
} as const;

interface TxSimulationSummaryProps {
    amount: EvmAssetDiff['in'][number];
    assetDiff?: EvmAssetDiff;
    networkSymbol: NetworkSymbol;
    /** Set for a transfer; an approval is described only by the provider's summary. */
    direction?: keyof typeof TRANSFER_MESSAGE_ID;
}

export function TxSimulationSummary({
    amount,
    assetDiff,
    networkSymbol,
    direction,
}: TxSimulationSummaryProps) {
    const value = assetDiff && direction ? getEvmAssetDiffValue(assetDiff.asset, amount) : null;

    if (value && direction) {
        return (
            <Translation
                id={TRANSFER_MESSAGE_ID[direction]}
                values={{ amount: <AssetValue {...value} networkSymbol={networkSymbol} /> }}
            />
        );
    }

    if (amount.summary) {
        return amount.summary;
    }

    // Token asset summary
    if (assetDiff?.asset && 'address' in assetDiff.asset) {
        return `${assetDiff?.asset.type} ${assetDiff.asset.address}`;
    }

    return null;
}
