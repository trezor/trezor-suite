import { type ReactNode } from 'react';

import { Address } from '@suite/address';
import { Translation, type TranslationKey } from '@suite/intl';
import {
    type AllowanceLimitType,
    type AllowanceStepState,
    type AllowanceStepVariant,
    type AllowanceTransactionType,
} from '@suite-common/wallet-types';
import { Button, Column, Text, TextButton } from '@trezor/components';
import { FlowStep } from '@trezor/product-components';

import { AllowanceStepLimitRows } from './AllowanceStepLimitRows';
import { AllowanceStepRow } from './AllowanceStepRow';
import { type AllowanceStepToken } from './AllowanceStepToken';

export const ALLOWANCE_STEP_TEXT_ID = {
    approve: {
        title: 'TR_APPROVAL_STEP_APPROVE_TITLE',
        description: 'TR_APPROVAL_STEP_APPROVE_DESCRIPTION',
        done: 'TR_APPROVAL_STEP_DONE_APPROVE',
        pending: 'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL',
    },
    increase: {
        title: 'TR_APPROVAL_STEP_INCREASE_TITLE',
        description: 'TR_APPROVAL_STEP_INCREASE_DESCRIPTION',
        done: 'TR_APPROVAL_STEP_DONE_APPROVE',
        pending: 'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL',
    },
    revoke: {
        title: 'TR_APPROVAL_STEP_REVOKE_TITLE',
        description: 'TR_APPROVAL_STEP_REVOKE_DESCRIPTION',
        done: 'TR_APPROVAL_STEP_DONE_REVOKE',
        pending: 'TR_EXCHANGE_APPROVAL_FORM_REVOKING_APPROVAL',
    },
} as const satisfies Record<
    AllowanceStepVariant,
    Record<'title' | 'description' | 'done' | 'pending', TranslationKey>
>;

const VARIANT_TRANSACTION_TYPE = {
    approve: 'approve',
    increase: 'approve',
    revoke: 'revoke',
} as const satisfies Record<AllowanceStepVariant, AllowanceTransactionType>;

export type AllowanceStepCardProps = {
    variant: AllowanceStepVariant;
    state: AllowanceStepState;
    step: number;
    totalSteps: number;
    token: AllowanceStepToken;
    limitType: AllowanceLimitType;
    limitAmount: string;
    currentLimitAmount?: string;
    onEditLimit?: () => void;
    networkFee: ReactNode;
    onEditFee?: () => void;
    txid?: string;
    onTxidClick?: () => void;
    isContinueDisabled?: boolean;
    isContinueLoading?: boolean;
    onContinue: () => void;
    'data-testid'?: string;
};

export const AllowanceStepCard = ({
    variant,
    state,
    step,
    totalSteps,
    token,
    limitType,
    limitAmount,
    currentLimitAmount,
    onEditLimit,
    networkFee,
    onEditFee,
    txid,
    onTxidClick,
    isContinueDisabled = false,
    isContinueLoading = false,
    onContinue,
    'data-testid': dataTest,
}: AllowanceStepCardProps) => {
    const textIds = ALLOWANCE_STEP_TEXT_ID[variant];
    const isPending = state === 'pending';

    if (state === 'done') {
        return (
            <FlowStep
                state="done"
                label={
                    <Translation
                        id="TR_STEP_OF_TOTAL"
                        values={{ index: step, total: totalSteps }}
                    />
                }
                title={<Translation id={textIds.done} />}
                data-testid={dataTest}
            />
        );
    }

    return (
        <FlowStep
            state="active"
            label={
                <Translation id="TR_STEP_OF_TOTAL" values={{ index: step, total: totalSteps }} />
            }
            title={<Translation id={textIds.title} />}
            description={<Translation id={textIds.description} values={{ symbol: token.symbol }} />}
            data-testid={dataTest}
        >
            <Column gap={12}>
                <AllowanceStepLimitRows
                    transactionType={VARIANT_TRANSACTION_TYPE[variant]}
                    token={token}
                    limitType={limitType}
                    limitAmount={limitAmount}
                    currentLimitAmount={variant === 'increase' ? currentLimitAmount : undefined}
                    onEditLimit={isPending ? undefined : onEditLimit}
                />
                <AllowanceStepRow
                    label="TR_NETWORK_FEE"
                    onEdit={isPending ? undefined : onEditFee}
                    data-testid="@approval-step/fee"
                >
                    {networkFee}
                </AllowanceStepRow>
                {isPending && (
                    <AllowanceStepRow
                        label="TR_TRADING_DETAIL_TRANSACTION_ID"
                        data-testid="@approval-step/txid"
                    >
                        {txid ? (
                            <TextButton onClick={onTxidClick} size="small" intent="brand">
                                <Address
                                    isTruncated
                                    isChunked={false}
                                    isUnderlined
                                    value={txid}
                                    data-testid="@approval-step/txid-value"
                                />
                            </TextButton>
                        ) : (
                            <Translation id="TR_UNKNOWN" />
                        )}
                    </AllowanceStepRow>
                )}
            </Column>
            <Column gap={8} alignItems="center">
                <Button
                    size="large"
                    width="100%"
                    isDisabled={isPending || isContinueDisabled}
                    isLoading={isPending || isContinueLoading}
                    onClick={onContinue}
                    data-testid="@approval-step/continue"
                >
                    <Translation id={isPending ? textIds.pending : 'TR_CONTINUE'} />
                </Button>
                {isPending && (
                    <Text typographyStyle="body-sm" intent="neutral">
                        <Translation id="TR_APPROVAL_STEP_PENDING_HINT" />
                    </Text>
                )}
            </Column>
        </FlowStep>
    );
};
