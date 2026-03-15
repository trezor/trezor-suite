import { yup } from '@suite-common/validators';
import { getEvmApprovalTxData } from '@suite-common/wallet-utils';

const approvalTransactionSchema = yup
    .object({
        spender: yup.string().optional(),
        data: yup.string().optional(),
        transactionData: yup.string().optional(),
        tx: yup
            .object({
                spender: yup.string().optional(),
                data: yup.string().optional(),
            })
            .optional(),
        transaction: yup
            .object({
                data: yup.string().optional(),
            })
            .optional(),
    })
    .noUnknown(false);

type ApprovalTransactionRecord = yup.InferType<typeof approvalTransactionSchema>;

const evmTransactionSchema = yup
    .object({
        to: yup.string().optional(),
    })
    .noUnknown(false);

type EvmTransactionRecord = yup.InferType<typeof evmTransactionSchema>;

const parseApprovalTransaction = (value: unknown): ApprovalTransactionRecord | null => {
    let parsedValue = value;

    if (typeof parsedValue === 'string') {
        try {
            parsedValue = JSON.parse(parsedValue);
        } catch {
            return null;
        }
    }

    try {
        return approvalTransactionSchema.validateSync(parsedValue, { strict: true });
    } catch {
        return null;
    }
};

const parseEvmTransaction = (value: unknown): EvmTransactionRecord | null => {
    let parsedValue = value;

    if (typeof parsedValue === 'string') {
        try {
            parsedValue = JSON.parse(parsedValue);
        } catch {
            return null;
        }
    }

    try {
        return evmTransactionSchema.validateSync(parsedValue, { strict: true });
    } catch {
        return null;
    }
};

export const parseApprovalSpenderFromTransaction = (transaction: unknown): string | null => {
    const parsedTransaction = parseApprovalTransaction(transaction);

    if (!parsedTransaction) {
        return null;
    }

    const { structuredTransaction, unsignedTransaction, annotatedTransaction } =
        transaction as Record<string, unknown>;

    const decodedStructuredTransaction = parseApprovalTransaction(structuredTransaction);
    const decodedUnsignedTransaction = parseApprovalTransaction(unsignedTransaction);
    const decodedAnnotatedTransaction = parseApprovalTransaction(annotatedTransaction);

    const spenderCandidates = [
        parsedTransaction,
        parseApprovalTransaction(structuredTransaction),
        parseApprovalTransaction(unsignedTransaction),
        parseApprovalTransaction(annotatedTransaction),
        decodedStructuredTransaction,
        decodedUnsignedTransaction,
        decodedAnnotatedTransaction,
    ]
        .filter((record): record is ApprovalTransactionRecord => record !== null)
        .map(record => record.spender ?? record.tx?.spender)
        .find(spender => !!spender);

    if (spenderCandidates) {
        return spenderCandidates.toLowerCase();
    }

    const directCalldataCandidates = [
        structuredTransaction,
        unsignedTransaction,
        annotatedTransaction,
    ]
        .filter((value): value is string => typeof value === 'string')
        .filter(value => value.toLowerCase().startsWith('0x'));

    const calldataCandidates = [
        ...directCalldataCandidates,
        parsedTransaction,
        parseApprovalTransaction(structuredTransaction),
        parseApprovalTransaction(unsignedTransaction),
        parseApprovalTransaction(annotatedTransaction),
        decodedStructuredTransaction,
        decodedUnsignedTransaction,
        decodedAnnotatedTransaction,
    ]
        .filter((record): record is ApprovalTransactionRecord => record !== null)
        .flatMap(record => [
            record.data,
            record.transactionData,
            record.tx?.data,
            record.transaction?.data,
        ])
        .filter((data): data is string => !!data);

    for (const calldata of calldataCandidates) {
        const approvalData = getEvmApprovalTxData(calldata);

        if (approvalData?.spender) {
            return approvalData.spender;
        }
    }

    return null;
};

export const parseTransactionToFromTransaction = (transaction: unknown): string | null => {
    const parsedTransaction = parseEvmTransaction(transaction);

    if (!parsedTransaction) {
        return null;
    }

    const { structuredTransaction, unsignedTransaction, annotatedTransaction } =
        transaction as Record<string, unknown>;

    return (
        [
            parsedTransaction,
            parseEvmTransaction(structuredTransaction),
            parseEvmTransaction(unsignedTransaction),
            parseEvmTransaction(annotatedTransaction),
        ]
            .filter((record): record is EvmTransactionRecord => record !== null)
            .map(record => record.to)
            .find((to): to is string => !!to)
            ?.toLowerCase() ?? null
    );
};
