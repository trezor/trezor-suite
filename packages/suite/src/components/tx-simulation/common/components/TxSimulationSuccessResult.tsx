import { TxSimulationResult } from '@suite/tx-simulation/src/common';
import { EvmTxSimulationAsset } from '@suite/tx-simulation/src/evm';
import { type NetworkTxSimulationResult } from '@suite-common/tx-simulation';
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
            if (payload.simulation?.status !== 'Success') {
                return null;
            }

            const { assets_diffs, exposures } = payload.simulation.account_summary;

            return (
                <>
                    <TxSimulationResult
                        isEmpty={assets_diffs.length === 0 && exposures.length === 0}
                    >
                        {assets_diffs.map((assetDiff, index) => (
                            <EvmTxSimulationAsset
                                key={index}
                                assetDiff={assetDiff}
                                network={network}
                            />
                        ))}
                        {exposures.map((assetExposure, index) => (
                            <EvmTxSimulationAsset
                                key={index}
                                assetExposure={assetExposure}
                                network={network}
                            />
                        ))}
                    </TxSimulationResult>
                    {targetContract && (
                        <TxSimulationContractInfo
                            targetContract={targetContract}
                            simulation={payload.simulation}
                            network={network}
                        />
                    )}
                </>
            );
        }

        default:
            return null;
    }
}
