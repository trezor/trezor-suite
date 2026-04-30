import { getTransferCounterparty } from './getTransferCounterparty';
import { getTransferDirection } from './getTransferDirection';
import { getTransferRail } from './getTransferRail';
import { getTransferSummary } from './getTransferSummary';
import { getTransferValue } from './getTransferValue';
import { type SparkTransfer } from '../feature/sparkFeatureReducer';

type SparkTransferRecord = Record<string, unknown>;

export const mapSparkTransfer = (transfer: unknown): SparkTransfer => {
    const transferRecord = typeof transfer === 'object' && transfer !== null ? transfer : {};
    const typedTransferRecord = transferRecord as SparkTransferRecord;
    const direction = getTransferDirection(typedTransferRecord);
    const rail = getTransferRail(typedTransferRecord);
    const createdAt = typedTransferRecord.createdTime;
    const updatedAt = typedTransferRecord.updatedTime;

    return {
        amountSats: getTransferValue(typedTransferRecord),
        counterparty: getTransferCounterparty({
            direction,
            transfer: typedTransferRecord,
        }),
        createdAt:
            // eslint-disable-next-line no-nested-ternary
            createdAt instanceof Date
                ? createdAt.toISOString()
                : updatedAt instanceof Date
                  ? updatedAt.toISOString()
                  : new Date().toISOString(),
        direction,
        id:
            typeof typedTransferRecord.id === 'string' && typedTransferRecord.id.length > 0
                ? typedTransferRecord.id
                : crypto.randomUUID(),
        rail,
        status:
            typeof typedTransferRecord.status === 'string' ? typedTransferRecord.status : 'UNKNOWN',
        summary: getTransferSummary({ direction, rail }),
    };
};
