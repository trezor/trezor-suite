import { TxSimulationResult } from '@suite/tx-simulation/src/common';
import { EvmTxSimulationAsset, TxSimulationCrossChainAsset } from '@suite/tx-simulation/src/evm';
import { SolanaTxSimulationAsset } from '@suite/tx-simulation/src/solana';
import { StellarTxSimulationAsset } from '@suite/tx-simulation/src/stellar';
import {
    type NetworkTxSimulationResult,
    getCrossChainAssetDiffs,
    getEvmSimulationSummary,
    getSolanaAssetDiffs,
    getStellarAssetDiffs,
} from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';

import { TxSimulationContractInfo } from './TxSimulationContractInfo';

export interface TxSimulationSuccessResultProps {
    result: NetworkTxSimulationResult;
    network: Network;
    targetContract: string | null;
}

export function TxSimulationSuccessResult({
    result: { method, payload },
    network,
    targetContract,
}: TxSimulationSuccessResultProps) {
    switch (method) {
        case 'ethereumSignTransaction':
        case 'ethereumSignTypedData': {
            const summary = getEvmSimulationSummary(payload);

            if (!summary) {
                return null;
            }

            const { simulation, assetsDiffs, exposures } = summary;
            // A bridge leaves the account summary empty — its outcome is reported per chain.
            const crossChainDiffs = getCrossChainAssetDiffs(simulation, payload.account_address);

            return (
                <>
                    <TxSimulationResult
                        isEmpty={
                            assetsDiffs.length === 0 &&
                            exposures.length === 0 &&
                            crossChainDiffs.length === 0
                        }
                    >
                        {assetsDiffs.map((assetDiff, index) => (
                            <EvmTxSimulationAsset
                                key={`asset-diff-${index}`}
                                assetDiff={assetDiff}
                                network={network}
                            />
                        ))}
                        {crossChainDiffs.map((assetDiff, index) => (
                            <TxSimulationCrossChainAsset
                                key={`cross-chain-diff-${index}`}
                                assetDiff={assetDiff}
                            />
                        ))}
                        {exposures.map((assetExposure, index) => (
                            <EvmTxSimulationAsset
                                key={`asset-exposure-${index}`}
                                assetExposure={assetExposure}
                                network={network}
                            />
                        ))}
                    </TxSimulationResult>
                    {targetContract && (
                        <TxSimulationContractInfo
                            targetContract={targetContract}
                            simulation={simulation}
                            network={network}
                        />
                    )}
                </>
            );
        }

        case 'solanaSignTransaction': {
            const assetDiffs = getSolanaAssetDiffs(payload);

            if (!assetDiffs) {
                return null;
            }

            return (
                <TxSimulationResult isEmpty={assetDiffs.length === 0}>
                    {assetDiffs.map((assetDiff, index) => (
                        <SolanaTxSimulationAsset
                            key={`asset-diff-${index}`}
                            assetDiff={assetDiff}
                            network={network}
                        />
                    ))}
                </TxSimulationResult>
            );
        }

        case 'stellarSignTransaction': {
            const assetDiffs = getStellarAssetDiffs(payload);

            if (!assetDiffs) {
                return null;
            }

            return (
                <TxSimulationResult isEmpty={assetDiffs.length === 0}>
                    {assetDiffs.map((assetDiff, index) => (
                        <StellarTxSimulationAsset
                            key={`asset-diff-${index}`}
                            assetDiff={assetDiff}
                            network={network}
                        />
                    ))}
                </TxSimulationResult>
            );
        }

        default:
            return null;
    }
}
