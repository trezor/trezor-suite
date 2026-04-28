export * from './client';
export type * from './types';
export { getSimulationErrorRiskLevel, areTxSimulationMethods } from './utils';
export { useDappScan } from './hooks/useDappScan';
export {
    useNetworkTxSimulation,
    type NetworkTxSimulationResult,
    type TxSimulationEVMResult,
} from './hooks/useNetworkTxSimulation';
export { useTxSimulation } from './hooks/useTxSimulation';

export type { AccountSummary, TransactionSimulation } from '@blockaid/client/resources/evm';
