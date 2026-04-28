import { TxSimulationResult } from '@suite/tx-simulation';
import { TxSimulationAsset } from '@suite/tx-simulation/src/components/TxSimulationAsset/TxSimulationAsset';
import { type NetworkTxSimulationResult } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';

import { TxSimulationContractInfo } from './components/TxSimulationContractInfo';

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
                            <TxSimulationAsset
                                key={index}
                                assetDiff={assetDiff}
                                network={network}
                            />
                        ))}
                        {exposures.map((assetExposure, index) => (
                            <TxSimulationAsset
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
