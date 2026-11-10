import { type EvmAssetDiff } from '@suite-common/tx-simulation';

import { TxSimulationMaskedText } from '../../../common/components/TxSimulationMaskedText';

interface TxSimulationSummaryProps {
    amount: EvmAssetDiff['in'][number];
    assetDiff?: EvmAssetDiff;
}

export function TxSimulationSummary({ amount, assetDiff }: TxSimulationSummaryProps) {
    if (amount.summary) {
        return <TxSimulationMaskedText text={amount.summary} />;
    }

    // Native asset summary
    if (assetDiff?.asset_type === 'NATIVE' && 'value' in amount) {
        return <TxSimulationMaskedText text={`${amount.value} ${assetDiff.asset.symbol}`} />;
    }

    // Token asset summary
    if (assetDiff?.asset && 'address' in assetDiff.asset) {
        return `${assetDiff?.asset.type} ${assetDiff.asset.address}`;
    }

    return null;
}
