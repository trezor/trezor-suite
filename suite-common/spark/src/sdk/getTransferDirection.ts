import { type SparkTransfer } from '../feature/sparkFeatureReducer';

type SparkTransferRecord = Record<string, unknown>;

export const getTransferDirection = (transfer: SparkTransferRecord): SparkTransfer['direction'] =>
    transfer.transferDirection === 'OUTGOING' ? 'send' : 'receive';
