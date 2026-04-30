import { type SparkTransfer } from '../feature/sparkFeatureReducer';

type SparkTransferRecord = Record<string, unknown>;

export const getTransferRail = (transfer: SparkTransferRecord): SparkTransfer['rail'] => {
    if (transfer.type === 'COOPERATIVE_EXIT') {
        return 'bitcoin';
    }

    const { userRequest } = transfer;

    if (typeof userRequest === 'object' && userRequest !== null) {
        const requestRecord = userRequest as Record<string, unknown>;
        const requestType = [
            requestRecord.type,
            requestRecord.__typename,
            requestRecord.constructor?.name,
        ]
            .filter(value => typeof value === 'string')
            .join(' ')
            .toUpperCase();

        if (requestType.includes('LIGHTNING')) {
            return 'lightning';
        }
    }

    return 'spark';
};
