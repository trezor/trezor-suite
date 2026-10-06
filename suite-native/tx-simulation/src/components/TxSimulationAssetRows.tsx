import {
    type NetworkTxSimulationResult,
    getCrossChainAssetDiffs,
    getEvmSimulationSummary,
    getSolanaAssetDiffs,
    getStellarAssetDiffs,
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
        const summary = getEvmSimulationSummary(result.payload);

        if (!summary) {
            return null;
        }

        const { simulation, assetsDiffs, exposures } = summary;
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
        const assetDiffs = getSolanaAssetDiffs(result.payload);

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

    const stellarAssetDiffs = isTxSimulationResultWithMethods(
        ['stellarSignTransaction'] as const,
        result,
    )
        ? getStellarAssetDiffs(result.payload)
        : null;

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
