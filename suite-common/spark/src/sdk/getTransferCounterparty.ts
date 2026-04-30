import { getTransferRail } from './getTransferRail';
import { type SparkTransfer } from '../feature/sparkFeatureReducer';

type SparkTransferRecord = Record<string, unknown>;

const railFallbackCounterpartyMap: Record<
    SparkTransfer['rail'],
    Record<SparkTransfer['direction'], string>
> = {
    bitcoin: {
        receive: 'Bitcoin deposit',
        send: 'Bitcoin withdrawal',
    },
    lightning: {
        receive: 'Lightning payer',
        send: 'Lightning invoice',
    },
    spark: {
        receive: 'Spark sender',
        send: 'Spark recipient',
    },
};

type GetTransferCounterpartyParams = {
    direction: SparkTransfer['direction'];
    transfer: SparkTransferRecord;
};

export const getTransferCounterparty = ({ direction, transfer }: GetTransferCounterpartyParams) => {
    const preferredField =
        direction === 'send'
            ? transfer.receiverIdentityPublicKey
            : transfer.senderIdentityPublicKey;

    if (typeof preferredField === 'string' && preferredField.length > 0) {
        return preferredField;
    }

    if (typeof transfer.sparkInvoice === 'string' && transfer.sparkInvoice.length > 0) {
        return transfer.sparkInvoice;
    }

    return railFallbackCounterpartyMap[getTransferRail(transfer)][direction];
};
