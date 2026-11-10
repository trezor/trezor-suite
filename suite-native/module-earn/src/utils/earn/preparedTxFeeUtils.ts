import { buildStablecoinYieldTransactionReview } from '@suite-common/earn-stablecoin';
import { parseUnsignedEvmTransactionForSigning } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { buildEvmFeeFields, buildEvmSelectedFee } from '@suite-common/wallet-core';
import {
    type FeeInfo,
    type FeeLevelLabel,
    type FormState,
    type PrecomposedLevels,
    type PrecomposedTransaction,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { calculateTotalGasCost, fromHex, isEip1559 } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

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

type BuildPreparedTxFeeDraftStateParams = BuildPreparedTxFeeLevelsParams & {
    currentFormDraft?: FormState;
    availableBalance?: string;
};

type PreparedTxFeeFields = Pick<
    FormState,
    'selectedFee' | 'feePerUnit' | 'feeLimit' | 'maxFeePerGas' | 'maxPriorityFeePerGas'
>;

type BuildPreparedTxSelectedFeeUnsignedTransactionParams = {
    currentFormDraft?: PreparedTxFeeFields;
    feeInfo: FeeInfo;
    unsignedTransaction: string;
};

type BuildPreparedTxFeeDraftStateResult = {
    feeLevels: PrecomposedLevels;
    formDraft: FormState;
    isCustomFeeReplaced: boolean;
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

const isPreparedTxEip1559FeeInfo = (feeInfo: FeeInfo) => isEip1559(feeInfo.levels[0]);

const getPreparedTxFeeState = (
    currentFormDraft: PreparedTxFeeFields | undefined,
    isEip1559Fee: boolean,
) => {
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
}: BuildPreparedTxFeeLevelsParams) =>
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
    const isEip1559Fee = isPreparedTxEip1559FeeInfo(feeInfo);
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

const applyPreparedTxFeeBalance = (
    preview: PrecomposedTransactionFinal,
    unsignedTransaction: string,
    availableBalance: string | undefined,
): PrecomposedTransaction => {
    if (availableBalance === undefined) return preview;

    const balance = new BigNumber(availableBalance);
    const transaction = parseUnsignedEvmTransactionForSigning(unsignedTransaction);
    const cost = new BigNumber(preview.fee).plus(
        fromHex(transaction?.value ?? '0x0').toBigNumber(),
    );

    return balance.isFinite() && cost.lte(balance)
        ? preview
        : { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' };
};

type BuildPreparedTxCustomFeeLevelParams = BuildPreparedTxSelectedFeeUnsignedTransactionParams & {
    availableBalance?: string;
    estimatedFeeLimit: string;
};

export const buildPreparedTxCustomFeeLevel = ({
    availableBalance,
    estimatedFeeLimit,
    ...params
}: BuildPreparedTxCustomFeeLevelParams): PrecomposedTransaction | undefined => {
    const unsignedTransaction = buildPreparedTxSelectedFeeUnsignedTransaction(params);
    if (!unsignedTransaction) return;

    const preview = buildPreparedTxFeePreview(unsignedTransaction);

    return preview
        ? applyPreparedTxFeeBalance(
              { ...preview, estimatedFeeLimit },
              unsignedTransaction,
              availableBalance,
          )
        : undefined;
};

export const buildPreparedTxFeeDraftState = ({
    currentFormDraft,
    availableBalance,
    ...feeLevelParams
}: BuildPreparedTxFeeDraftStateParams): BuildPreparedTxFeeDraftStateResult | null => {
    try {
        const feeLevels = buildPreparedTxFeeLevels(feeLevelParams);
        const feeState = getPreparedTxFeeState(
            currentFormDraft,
            isPreparedTxEip1559FeeInfo(feeLevelParams.feeInfo),
        );
        // An amount change may need more gas than the confirmed Custom limit.
        const isCustomFeeReplaced =
            feeState.selectedFee === 'custom' &&
            new BigNumber(currentFormDraft?.feeLimit ?? 0).lt(feeLevelParams.gasLimit);
        const selectedFee = isCustomFeeReplaced ? 'normal' : feeState.selectedFee;

        const selectedFeeUnsignedTransaction = buildPreparedTxSelectedFeeUnsignedTransaction({
            currentFormDraft: currentFormDraft && { ...currentFormDraft, selectedFee },
            feeInfo: feeLevelParams.feeInfo,
            unsignedTransaction: feeLevelParams.unsignedTransaction,
        });
        if (!selectedFeeUnsignedTransaction) return null;

        const selectedFeePreview = buildPreparedTxFeePreview(selectedFeeUnsignedTransaction);
        if (!selectedFeePreview) return null;

        const { formState } = buildStablecoinYieldTransactionReview({
            amount: feeLevelParams.amount,
            selectedFee: null,
            selectedFeeLevel: selectedFee,
            symbol: feeLevelParams.symbol,
            token: feeLevelParams.token,
            unsignedTransaction: selectedFeeUnsignedTransaction,
        });
        const previews =
            selectedFee === 'custom' ? { ...feeLevels, custom: selectedFeePreview } : feeLevels;

        return {
            feeLevels: Object.fromEntries(
                Object.entries(previews).map(([label, preview]) => [
                    label,
                    applyPreparedTxFeeBalance(
                        { ...preview, estimatedFeeLimit: feeLevelParams.gasLimit },
                        feeLevelParams.unsignedTransaction,
                        availableBalance,
                    ),
                ]),
            ),
            formDraft: { ...formState, estimatedFeeLimit: feeLevelParams.gasLimit },
            isCustomFeeReplaced,
            selectedFeeUnsignedTransaction,
        };
    } catch {
        return null;
    }
};
