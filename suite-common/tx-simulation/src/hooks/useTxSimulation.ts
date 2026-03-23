import { type TxSimulationAction } from '@suite-common/wallet-types';

import { type TxSimulationEVMResult, useTxSimulationEVM } from './useTxSimulationEVM';
import {
    getNetworkFromTxSimulationAction,
    getTargetContractFromTxSimulationAction,
} from '../utils';
import { useTxSimulationPayload } from './useTxSimulationPayload';

interface UseTxSimulationConnectProps {
    onSuccess?: (result: TxSimulationEVMResult) => void;
}

export const useTxSimulation = (
    action: TxSimulationAction,
    { onSuccess }: UseTxSimulationConnectProps = {},
) => {
    const network = getNetworkFromTxSimulationAction(action);
    const targetContract = getTargetContractFromTxSimulationAction(action);

    const payload = useTxSimulationPayload(action);
    const txSimulationQuery = useTxSimulationEVM(payload, onSuccess);

    return {
        txSimulationQuery,
        network,
        targetContract,
    };
};
