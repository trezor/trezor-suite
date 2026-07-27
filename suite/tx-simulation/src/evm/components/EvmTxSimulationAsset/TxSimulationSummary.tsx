import { type EvmAssetDiff } from '@suite-common/tx-simulation';

interface TxSimulationSummaryProps {
    amount: EvmAssetDiff['in'][number];
    assetDiff?: EvmAssetDiff;
}

export function TxSimulationSummary({ amount, assetDiff }: TxSimulationSummaryProps) {
    if (amount.summary) {
        return amount.summary;
    }

    // Native asset summary
    if (assetDiff?.asset_type === 'NATIVE' && 'value' in amount) {
        return `${amount.value} ${assetDiff.asset.symbol}`;
    }

    // Token asset summary
    if (assetDiff?.asset && 'address' in assetDiff.asset) {
        return `${assetDiff?.asset.type} ${assetDiff.asset.address}`;
    }

    return null;
}
