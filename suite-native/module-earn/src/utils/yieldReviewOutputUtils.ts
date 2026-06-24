import {
    buildClaimTransactionReview,
    buildStablecoinYieldTransactionReview,
} from '@suite-common/earn-stablecoin/src/signing';
import { type TrezorDevice } from '@suite-common/suite-types';
import {
    type StablecoinYieldActionReviewState,
    type YieldFlowDisplayToken,
    type YieldFlowResolvedData,
} from '@suite-common/wallet-core';
import {
    type Account,
    type EvmSelectedFee,
    type EvmTransactionPurpose,
    type FormState,
    type PrecomposedTransactionFinal,
    type ReviewOutput,
    type YieldClaimReward,
} from '@suite-common/wallet-types';
import {
    constructTransactionReviewOutputs,
    getEvmTransactionTextSignature,
} from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import { getSelectedFeeFromUnsignedClaimTransaction } from './yieldClaimFeeUtils';
import { buildYieldClaimRewards } from './yieldClaimReviewUtils';

type YieldActionReview = Extract<
    StablecoinYieldActionReviewState,
    { type: 'deposit' | 'withdraw' | 'redeem' }
>;
type YieldDepositReview = YieldActionReview & { type: 'deposit' };
type YieldWithdrawReview = YieldActionReview & { type: 'withdraw' };
type YieldClaimReview = Extract<StablecoinYieldActionReviewState, { type: 'claim' }>;

export type YieldReviewEvmTransactionPurpose = Extract<
    EvmTransactionPurpose,
    'approve' | 'claim' | 'deposit' | 'redeem' | 'revoke' | 'withdraw'
>;
export type YieldApprovalReviewEvmTransactionPurpose = Extract<
    YieldReviewEvmTransactionPurpose,
    'approve' | 'revoke'
>;
type YieldTransactionReviewOutputType =
    | 'address'
    | 'amount'
    | 'contract'
    | 'data'
    | 'regular_legacy'
    | 'rewards';
type YieldTransactionReviewValueOutput = Extract<ReviewOutput, { value: string }> & {
    type: Exclude<YieldTransactionReviewOutputType, 'rewards'>;
};
type YieldTransactionReviewRewardsOutput = Extract<ReviewOutput, { type: 'rewards' }>;

export type YieldTransactionReviewOutput =
    | YieldTransactionReviewRewardsOutput
    | YieldTransactionReviewValueOutput;

type BuildYieldReviewPreviewBaseParams = {
    account: Account;
    availableRewards?: YieldClaimReward[];
    device: TrezorDevice;
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
    vaultName?: string;
};

type BuildYieldDepositReviewPreviewParams = {
    device: TrezorDevice;
    flowData: YieldFlowResolvedData;
    review: YieldDepositReview;
    type: 'deposit';
    vaultName: string;
};

type BuildYieldWithdrawReviewPreviewParams = {
    device: TrezorDevice;
    flowData: YieldFlowResolvedData;
    review: YieldWithdrawReview;
    reviewToken: YieldFlowDisplayToken;
    selectedFee?: EvmSelectedFee | null;
    type: 'withdraw';
    vaultName: string;
};

type BuildYieldClaimReviewPreviewParams = {
    account: Account;
    device: TrezorDevice;
    review: YieldClaimReview;
    type: 'claim';
};

type BuildYieldAllowanceReviewPreviewParams = {
    account: Account;
    device: TrezorDevice;
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
    type: 'approve' | 'revoke';
    vaultName?: string;
};

export type BuildYieldReviewPreviewParams =
    | BuildYieldDepositReviewPreviewParams
    | BuildYieldWithdrawReviewPreviewParams
    | BuildYieldClaimReviewPreviewParams
    | BuildYieldAllowanceReviewPreviewParams;

export type YieldReviewPreview = {
    evmTransactionPurpose: YieldReviewEvmTransactionPurpose;
    outputs: ReviewOutput[];
    summary: {
        fee: string;
    };
};

const yieldTransactionReviewOutputTypes = [
    'address',
    'amount',
    'contract',
    'data',
    'regular_legacy',
    'rewards',
] satisfies YieldTransactionReviewOutputType[];

export const isYieldTransactionReviewOutput = (
    reviewOutput: ReviewOutput,
): reviewOutput is YieldTransactionReviewOutput =>
    yieldTransactionReviewOutputTypes.includes(
        reviewOutput.type as YieldTransactionReviewOutputType,
    );

export const isYieldApprovalReviewPurpose = (
    evmTransactionPurpose: YieldReviewEvmTransactionPurpose,
): evmTransactionPurpose is YieldApprovalReviewEvmTransactionPurpose =>
    evmTransactionPurpose === 'approve' || evmTransactionPurpose === 'revoke';

const getYieldReviewEvmTransactionPurpose = (
    formState: FormState,
): YieldReviewEvmTransactionPurpose => {
    const evmTransactionPurpose = getEvmTransactionTextSignature(formState.transactionData);

    switch (evmTransactionPurpose) {
        case 'approve':
        case 'claim':
        case 'deposit':
        case 'redeem':
        case 'revoke':
        case 'withdraw':
            return evmTransactionPurpose;
        default:
            throw new Error(
                `Unsupported yield review transaction purpose: ${evmTransactionPurpose}`,
            );
    }
};

const buildYieldReviewPreviewResult = ({
    account,
    availableRewards,
    device,
    formState,
    precomposedTransaction,
    vaultName,
}: BuildYieldReviewPreviewBaseParams): YieldReviewPreview => {
    const evmTransactionPurpose = getYieldReviewEvmTransactionPurpose(formState);
    const outputs = constructTransactionReviewOutputs({
        account,
        availableRewards,
        decreaseOutputId: undefined,
        device,
        precomposedForm: formState,
        precomposedTx: precomposedTransaction,
        vaultName,
    });
    const preview = {
        evmTransactionPurpose,
        outputs,
        summary: {
            fee: precomposedTransaction.fee,
        },
    };

    if (!isYieldApprovalReviewPurpose(evmTransactionPurpose)) {
        const unsupportedOutput = outputs.find(output => !isYieldTransactionReviewOutput(output));

        if (unsupportedOutput) {
            throw new Error(`Unsupported yield review output type: ${unsupportedOutput.type}`);
        }
    }

    return preview;
};

export const buildYieldReviewPreview = (
    params: BuildYieldReviewPreviewParams,
): YieldReviewPreview | null => {
    try {
        switch (params.type) {
            case 'deposit': {
                const { formState, precomposedTransaction } = buildStablecoinYieldTransactionReview(
                    {
                        amount: params.review.amount,
                        selectedFee: null,
                        symbol: params.flowData.account.symbol,
                        token: params.flowData.token,
                        unsignedTransaction: params.review.unsignedTransaction,
                    },
                );

                return buildYieldReviewPreviewResult({
                    account: params.flowData.account,
                    device: params.device,
                    formState,
                    precomposedTransaction,
                    vaultName: params.vaultName,
                });
            }
            case 'withdraw': {
                const { formState, precomposedTransaction } = buildStablecoinYieldTransactionReview(
                    {
                        amount: params.review.amount,
                        selectedFee: params.selectedFee ?? null,
                        symbol: params.flowData.account.symbol,
                        token: params.reviewToken,
                        unsignedTransaction: params.review.unsignedTransaction,
                    },
                );

                return buildYieldReviewPreviewResult({
                    account: params.flowData.account,
                    device: params.device,
                    formState,
                    precomposedTransaction,
                    vaultName: params.vaultName,
                });
            }
            case 'claim': {
                const { availableRewards, formState, precomposedTransaction } =
                    buildClaimTransactionReview({
                        rewards: buildYieldClaimRewards(params.review),
                        selectedFee: getSelectedFeeFromUnsignedClaimTransaction(
                            params.review.unsignedTransaction,
                        ),
                        unsignedTransaction: params.review.unsignedTransaction,
                    });

                return buildYieldReviewPreviewResult({
                    account: params.account,
                    availableRewards,
                    device: params.device,
                    formState,
                    precomposedTransaction,
                });
            }
            case 'approve':
            case 'revoke':
                return buildYieldReviewPreviewResult({
                    account: params.account,
                    device: params.device,
                    formState: params.formState,
                    precomposedTransaction: params.precomposedTransaction,
                    vaultName: params.vaultName,
                });
            default:
                return exhaustive(params);
        }
    } catch {
        return null;
    }
};
