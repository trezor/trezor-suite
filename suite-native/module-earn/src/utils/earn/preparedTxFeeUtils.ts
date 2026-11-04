import { buildStablecoinYieldTransactionReview } from '@suite-common/earn-stablecoin';
import { parseUnsignedEvmTransactionForSigning } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { buildEvmFeeFields, buildEvmSelectedFee } from '@suite-common/wallet-core';
import {
    type FeeInfo,
    type FeeLevelLabel,
    type FormState,
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { calculateTotalGasCost, fromHex } from '@suite-common/wallet-utils';

type ParsedUnsignedEvmTransaction = NonNullable<
    ReturnType<typeof parseUnsignedEvmTransactionForSigning>
>;

export type PreparedTxFeeToken = {
    contractAddress?: string | null;
    decimals: number;
    symbol: string;
};

type BuildPreparedTxFeeLevelsParams = {
    amount: string;
    feeInfo: FeeInfo;
    gasLimit: string;
    symbol: NetworkSymbol;
    token: PreparedTxFeeToken;
    unsignedTransaction: string;
};

type BuildPreparedTxFeeFormDraftParams = {
    currentFormDraft?: FormState;
    formState: FormState;
    selectedFee: FeeLevelLabel;
};

type BuildPreparedTxFeeDraftStateParams = BuildPreparedTxFeeLevelsParams & {
    currentFormDraft?: FormState;
};

type BuildPreparedTxSelectedFeeUnsignedTransactionParams = {
    currentFormDraft?: FormState;
    feeInfo: FeeInfo;
    unsignedTransaction: string;
};

type BuildPreparedTxFeeDraftStateResult = {
    feeLevels: PrecomposedLevels;
    formDraft: FormState;
    selectedFeeUnsignedTransaction: string;
};

const buildPrecomposedTransaction = (
    tx: ParsedUnsignedEvmTransaction,
): PrecomposedTransactionFinal | null => {
    const gasPriceHex = tx.maxFeePerGas ?? tx.gasPrice;

    if (!gasPriceHex) {
        return null;
    }

    const gasLimit = fromHex(tx.gasLimit).toBigNumber().toFixed(0);
    const gasPrice = fromHex(gasPriceHex).toBigNumber().toFixed(0);
    const feePerByte = fromHex(gasPriceHex).asWei().toGwei();
    const fee = calculateTotalGasCost(gasPrice, gasLimit);
    const eip1559Fields: Partial<
        Pick<PrecomposedTransactionFinal, 'maxFeePerGas' | 'maxPriorityFeePerGas'>
    > =
        tx.maxFeePerGas && tx.maxPriorityFeePerGas
            ? {
                  maxFeePerGas: fromHex(tx.maxFeePerGas).asWei().toGwei(),
                  maxPriorityFeePerGas: fromHex(tx.maxPriorityFeePerGas).asWei().toGwei(),
              }
            : {};

    return {
        type: 'final',
        fee,
        feePerByte,
        feeLimit: gasLimit,
        totalSpent: fee,
        bytes: 0,
        inputs: [],
        outputs: [],
        outputsPermutation: [],
        ...eip1559Fields,
    };
};

const parseRawUnsignedEvmTransaction = (unsignedTransaction: string) => {
    const parsedTransaction = parseUnsignedEvmTransactionForSigning(unsignedTransaction);

    if (!parsedTransaction) {
        return null;
    }

    const rawTransaction = JSON.parse(unsignedTransaction) as Record<string, unknown>;

    return { parsedTransaction, rawTransaction };
};

const isPreparedTxEip1559FeeInfo = (feeInfo: FeeInfo) =>
    feeInfo.levels.some(feeLevel => feeLevel.maxFeePerGas && feeLevel.maxPriorityFeePerGas);

const getPreparedTxFeeState = (currentFormDraft: FormState | undefined, isEip1559Fee: boolean) => {
    const hasCompleteCustomFee =
        currentFormDraft?.selectedFee === 'custom' &&
        !!currentFormDraft.feePerUnit &&
        !!currentFormDraft.feeLimit;
    const hasCompleteEip1559CustomFee =
        !!currentFormDraft?.maxFeePerGas && !!currentFormDraft.maxPriorityFeePerGas;

    if (hasCompleteCustomFee && (!isEip1559Fee || hasCompleteEip1559CustomFee)) {
        const customFee = {
            feeLimit: currentFormDraft.feeLimit,
            feePerUnit: currentFormDraft.feePerUnit,
            ...(isEip1559Fee && currentFormDraft.maxFeePerGas
                ? { maxFeePerGas: currentFormDraft.maxFeePerGas }
                : {}),
            ...(isEip1559Fee && currentFormDraft.maxPriorityFeePerGas
                ? { maxPriorityFeePerGas: currentFormDraft.maxPriorityFeePerGas }
                : {}),
        };

        return {
            customFee,
            selectedFee: 'custom' as const,
        };
    }

    return {
        customFee: undefined,
        selectedFee:
            currentFormDraft?.selectedFee === 'custom'
                ? ('normal' as const)
                : (currentFormDraft?.selectedFee ?? 'normal'),
    };
};

const getPreparedTxFeeLevel = (feeInfo: FeeInfo, selectedFee: FeeLevelLabel) =>
    feeInfo.levels.find(level => level.label === selectedFee) ??
    feeInfo.levels.find(level => level.label === 'normal');

const buildUnsignedTransactionWithFeeFields = (
    rawTransaction: Record<string, unknown>,
    feeFields: ReturnType<typeof buildEvmFeeFields>,
) => {
    const transaction = { ...rawTransaction };
    delete transaction.gasPrice;
    delete transaction.maxFeePerGas;
    delete transaction.maxPriorityFeePerGas;
    delete transaction.baseFeePerGas;
    delete transaction.type;

    if ('maxFeePerGas' in feeFields && 'maxPriorityFeePerGas' in feeFields) {
        return {
            ...transaction,
            type: 2,
            gasLimit: feeFields.gasLimit,
            maxFeePerGas: feeFields.maxFeePerGas,
            maxPriorityFeePerGas: feeFields.maxPriorityFeePerGas,
        };
    }

    return {
        ...transaction,
        gasLimit: feeFields.gasLimit,
        gasPrice: feeFields.gasPrice,
    };
};

export const buildPreparedTxFeePreview = (
    unsignedTransaction: string,
): PrecomposedTransactionFinal | null => {
    const tx = parseUnsignedEvmTransactionForSigning(unsignedTransaction);

    if (!tx) {
        return null;
    }

    return buildPrecomposedTransaction(tx);
};

export const buildPreparedTxFeeLevels = ({
    amount,
    feeInfo,
    gasLimit,
    symbol,
    token,
    unsignedTransaction,
}: BuildPreparedTxFeeLevelsParams): PrecomposedLevels =>
    Object.fromEntries(
        feeInfo.levels
            .filter(feeLevel => feeLevel.label !== 'custom')
            .map(feeLevel => {
                const { precomposedTransaction } = buildStablecoinYieldTransactionReview({
                    amount,
                    selectedFee: buildEvmSelectedFee({ feeLevel, gasLimit }),
                    symbol,
                    token,
                    unsignedTransaction,
                });

                return [feeLevel.label, precomposedTransaction];
            }),
    );

export const buildPreparedTxSelectedFeeUnsignedTransaction = ({
    currentFormDraft,
    feeInfo,
    unsignedTransaction,
}: BuildPreparedTxSelectedFeeUnsignedTransactionParams): string | null => {
    const parsedUnsignedTransaction = parseRawUnsignedEvmTransaction(unsignedTransaction);

    if (!parsedUnsignedTransaction) {
        return null;
    }

    const { parsedTransaction, rawTransaction } = parsedUnsignedTransaction;
    const isEip1559Fee =
        isPreparedTxEip1559FeeInfo(feeInfo) ||
        !!(parsedTransaction.maxFeePerGas && parsedTransaction.maxPriorityFeePerGas);
    const { customFee, selectedFee } = getPreparedTxFeeState(currentFormDraft, isEip1559Fee);
    const gasLimit = fromHex(parsedTransaction.gasLimit).toBigNumber().toFixed(0);
    const feeLevel = customFee ? customFee : getPreparedTxFeeLevel(feeInfo, selectedFee);

    if (!feeLevel) {
        return null;
    }

    const feeFields = buildEvmFeeFields({
        feeLevel,
        gasLimit: customFee?.feeLimit ?? gasLimit,
    });

    return JSON.stringify(buildUnsignedTransactionWithFeeFields(rawTransaction, feeFields));
};

export const buildPreparedTxFeeFormDraft = ({
    currentFormDraft,
    formState,
    selectedFee,
}: BuildPreparedTxFeeFormDraftParams): FormState => {
    const shouldPreserveCustomFeeFields =
        selectedFee === 'custom' && !!currentFormDraft?.feePerUnit && !!currentFormDraft.feeLimit;
    const feeFields = shouldPreserveCustomFeeFields ? currentFormDraft : formState;

    return {
        ...formState,
        selectedFee,
        feePerUnit: feeFields.feePerUnit,
        feeLimit: feeFields.feeLimit,
        maxFeePerGas: feeFields.maxFeePerGas,
        maxPriorityFeePerGas: feeFields.maxPriorityFeePerGas,
    };
};

export const buildPreparedTxFeeDraftState = ({
    currentFormDraft,
    ...feeLevelParams
}: BuildPreparedTxFeeDraftStateParams): BuildPreparedTxFeeDraftStateResult | null => {
    try {
        const feeLevels = buildPreparedTxFeeLevels(feeLevelParams);
        const { selectedFee } = getPreparedTxFeeState(
            currentFormDraft,
            isPreparedTxEip1559FeeInfo(feeLevelParams.feeInfo),
        );
        const feeLevel = getPreparedTxFeeLevel(feeLevelParams.feeInfo, selectedFee);

        if (!feeLevel) {
            return null;
        }

        const selectedFeeUnsignedTransaction = buildPreparedTxSelectedFeeUnsignedTransaction({
            currentFormDraft,
            feeInfo: feeLevelParams.feeInfo,
            unsignedTransaction: feeLevelParams.unsignedTransaction,
        });

        if (!selectedFeeUnsignedTransaction) {
            return null;
        }

        const selectedFeePreview = buildPreparedTxFeePreview(selectedFeeUnsignedTransaction);

        if (!selectedFeePreview) {
            return null;
        }

        const { formState } = buildStablecoinYieldTransactionReview({
            amount: feeLevelParams.amount,
            selectedFee: buildEvmSelectedFee({
                feeLevel,
                gasLimit: feeLevelParams.gasLimit,
            }),
            symbol: feeLevelParams.symbol,
            token: feeLevelParams.token,
            unsignedTransaction: feeLevelParams.unsignedTransaction,
        });

        return {
            feeLevels:
                selectedFee === 'custom'
                    ? {
                          ...feeLevels,
                          custom: selectedFeePreview,
                      }
                    : feeLevels,
            formDraft: buildPreparedTxFeeFormDraft({
                currentFormDraft,
                formState,
                selectedFee,
            }),
            selectedFeeUnsignedTransaction,
        };
    } catch {
        return null;
    }
};
