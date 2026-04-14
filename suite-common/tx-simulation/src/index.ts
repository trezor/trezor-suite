export * from './client';
export type * from './types';
export { getSimulationErrorRiskLevel, areTxSimulationMethods } from './utils';
export { useDappScan } from './hooks/useDappScan';
export {
    useNetworkTxSimulation,
    isTxSimulationResultWithMethods,
    type NetworkTxSimulationResult,
    type TxSimulationEVMResult,
} from './hooks/useNetworkTxSimulation';
export { useTxSimulation } from './hooks/useTxSimulation';

export type { AccountSummary, TransactionSimulation } from '@blockaid/client/resources/evm';
export { TX_METHODS_WITH_FEES } from './config';
export {
    computeGasFeeInWei,
    useHasSufficientFundsForGas,
} from './hooks/useHasSufficientFundsForGas';
