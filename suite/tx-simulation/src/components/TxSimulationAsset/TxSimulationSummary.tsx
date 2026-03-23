import { type AssetDiff } from '@suite-common/tx-simulation';

interface TxSimulationSummaryProps {
    amount: AssetDiff['in'][number];
    assetDiff?: AssetDiff;
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
