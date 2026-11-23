import { useCachedEvmNetworks } from '@suite-common/evm-networks-api';
import { type TxSimulationAction } from '@suite-common/wallet-types';

import {
    getNetworkFromTxSimulationAction,
    getTargetContractFromTxSimulationAction,
    getTxSimulationParams,
} from '../utils';
import { type UseTxSimulationProps, useNetworkTxSimulation } from './useNetworkTxSimulation';

/**
 * @url https://docs.blockaid.io/docs/api-reference/end-user-protection/transaction-scanning/evm/transaction-scanning-evm/evm-scan-transaction
 */
export function useTxSimulation(
    action: TxSimulationAction | null,
    { onSuccess }: Pick<UseTxSimulationProps, 'onSuccess'> = {},
) {
    const evmNetworks = useCachedEvmNetworks();
    const input = getTxSimulationParams(action, evmNetworks);
    const txSimulationQuery = useNetworkTxSimulation(input, { onSuccess });
    const network = action ? getNetworkFromTxSimulationAction(action) : null;
    const targetContract = action ? getTargetContractFromTxSimulationAction(action) : null;

    if (!network || !input) {
        return null;
    }

    return { txSimulationQuery, network, targetContract };
}
