import {
    type NetworkTxSimulationResult,
    getCrossChainAssetDiffs,
    isTxSimulationResultWithMethods,
} from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { Box, Divider } from '@suite-native/atoms';

import { EvmTxSimulationStackedAsset } from './EvmTxSimulationStackedAsset';
import { EvmTxSimulationWrappedAsset } from './EvmTxSimulationWrappedAsset';
import { SolanaTxSimulationAsset } from './SolanaTxSimulationAsset';
import { StellarTxSimulationAsset } from './StellarTxSimulationAsset';
import { TxSimulationCrossChainAsset } from './TxSimulationCrossChainAsset';

export type TxSimulationAssetRowsProps = {
    result: NetworkTxSimulationResult;
    network: Network;
    areAssetDividersDisplayed?: boolean;
    assetVariant?: 'stack' | 'wrap';
};

export function TxSimulationAssetRows({
    result,
    network,
    areAssetDividersDisplayed = true,
    assetVariant = 'stack',
}: TxSimulationAssetRowsProps) {
    const EvmAsset =
        assetVariant === 'wrap' ? EvmTxSimulationWrappedAsset : EvmTxSimulationStackedAsset;

    if (
        isTxSimulationResultWithMethods(
            ['ethereumSignTypedData', 'ethereumSignTransaction'] as const,
            result,
        )
    ) {
        const { simulation } = result.payload;

        if (simulation?.status !== 'Success') {
            return null;
        }

        const { assets_diffs: assetsDiffs, exposures } = simulation.account_summary;
        // A bridge leaves the account summary empty — its outcome is reported per chain.
        const crossChainDiffs = getCrossChainAssetDiffs(simulation, result.payload.account_address);

        return (
            <>
                {assetsDiffs.map((assetDiff, index) => (
                    <Box key={`diff-${index}`}>
                        {areAssetDividersDisplayed && index > 0 && <Divider />}
                        <EvmAsset assetDiff={assetDiff} network={network} />
                    </Box>
                ))}
                {crossChainDiffs.map((assetDiff, index) => (
                    <Box key={`cross-chain-diff-${index}`}>
                        {areAssetDividersDisplayed && (index > 0 || assetsDiffs.length > 0) && (
                            <Divider />
                        )}
                        <TxSimulationCrossChainAsset assetDiff={assetDiff} />
                    </Box>
                ))}
                {exposures.map((assetExposure, index) => (
                    <Box key={`exposure-${index}`}>
                        {areAssetDividersDisplayed && (index > 0 || assetsDiffs.length > 0) && (
                            <Divider />
                        )}
                        <EvmAsset assetExposure={assetExposure} network={network} />
                    </Box>
                ))}
            </>
        );
    }

    if (isTxSimulationResultWithMethods(['solanaSignTransaction'] as const, result)) {
        const assetDiffs = result.payload.result?.simulation?.account_summary.account_assets_diff;

        if (!assetDiffs) {
            return null;
        }

        return (
            <>
                {assetDiffs.map((assetDiff, index) => (
                    <Box key={`solana-diff-${index}`}>
                        {areAssetDividersDisplayed && index > 0 && <Divider />}
                        <SolanaTxSimulationAsset assetDiff={assetDiff} network={network} />
                    </Box>
                ))}
            </>
        );
    }

    const stellarSimulation = isTxSimulationResultWithMethods(
        ['stellarSignTransaction'] as const,
        result,
    )
        ? result.payload.simulation
        : undefined;
    const stellarAssetDiffs =
        stellarSimulation?.status === 'Success'
            ? stellarSimulation.account_summary.account_assets_diffs
            : undefined;

    if (!stellarAssetDiffs) {
        return null;
    }

    return (
        <>
            {stellarAssetDiffs.map((assetDiff, index) => (
                <Box key={`stellar-diff-${index}`}>
                    {areAssetDividersDisplayed && index > 0 && <Divider />}
                    <StellarTxSimulationAsset assetDiff={assetDiff} network={network} />
                </Box>
            ))}
        </>
    );
}
