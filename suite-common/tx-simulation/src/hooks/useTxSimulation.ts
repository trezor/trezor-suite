import { type TxSimulationAction } from '@suite-common/wallet-types';

import { type UseTxSimulationProps, useNetworkTxSimulation } from './useNetworkTxSimulation';
import { useTxSimulationParams } from './useTxSimulationParams';
import {
    getNetworkFromTxSimulationAction,
    getTargetContractFromTxSimulationAction,
} from '../utils';

/**
 * @url https://docs.blockaid.io/docs/api-reference/end-user-protection/transaction-scanning/evm/transaction-scanning-evm/evm-scan-transaction
 */
export function useTxSimulation(
    action: TxSimulationAction,
    { onSuccess }: Pick<UseTxSimulationProps, 'onSuccess'> = {},
) {
    const network = getNetworkFromTxSimulationAction(action);
    const targetContract = getTargetContractFromTxSimulationAction(action);
    const input = useTxSimulationParams(action);
    const txSimulationQuery = useNetworkTxSimulation(input, { onSuccess });

    if (!network || !input) {
        return null;
    }

    return { txSimulationQuery, network, targetContract };
}
