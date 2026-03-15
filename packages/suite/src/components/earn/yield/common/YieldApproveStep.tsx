import { Translation } from '@suite/intl';
import type { TranslationKey } from '@suite/intl';
import { openModal } from '@suite/modal';
import type { Account } from '@suite-common/wallet-types';
import { Banner, BulletList, Button, Column, Link, Row, Spinner, Text } from '@trezor/components';
import type { BulletListItemState } from '@trezor/components';

import { Address } from 'src/components/suite/Address';
import { useDispatch } from 'src/hooks/suite';

import { YieldAmountCard } from './YieldAmountCard';
import type { YieldFlowDisplayToken } from './types';

export type YieldApproveStepDetails = {
    amountError?: string | null;
};

export type YieldApproveState = {
    error?: TranslationKey | null;
    isAmountInputDisabled?: boolean;
    isApproveButtonDisabled?: boolean;
    isApproveButtonLoading?: boolean;
};

export type YieldApprovalState = {
    isPending?: boolean;
    isRevokeRequired?: boolean;
    pendingType?: 'APPROVE' | 'REVOKE' | null;
    spender: string | null;
    txid?: string | null;
};

export type YieldApproveStepProps = {
    account: Account;
    token: YieldFlowDisplayToken;
    state: BulletListItemState;
    amount: string;
    maxAmount: string;
    balanceToken?: YieldFlowDisplayToken;
    balanceLabelTranslationId?: TranslationKey;
    amountLabelTranslationId?: TranslationKey;
    balanceValue?: string;
    switchCurrencyLabel?: string;
    isSwitchDisabled?: boolean;
    approveStep: YieldApproveStepDetails;
    approve: YieldApproveState;
    approval: YieldApprovalState;
    onAmountSelect: (amount: string) => void;
    onSwitchCurrency?: () => void;
    onApprove: () => void;
    onRevoke?: () => void;
};

export const YieldApproveStep = ({
    account,
    token,
    state,
    amount,
    maxAmount,
    balanceToken,
    balanceLabelTranslationId,
    amountLabelTranslationId,
    balanceValue,
    switchCurrencyLabel,
    isSwitchDisabled = false,
    approveStep,
    approve,
    approval,
    onAmountSelect,
    onSwitchCurrency,
    onApprove,
    onRevoke,
}: YieldApproveStepProps) => {
    const dispatch = useDispatch();
    const isActive = state === 'active';
    const isDone = state === 'done';
    const summaryValue = balanceValue ?? `${maxAmount} ${token.symbol}`;
    const approvalTxid = approval.txid ?? null;

    const handleApprovalTxidClick = (txid: string) => {
        dispatch(
            openModal({
                type: 'transaction-detail',
                txid,
                descriptor: account.descriptor,
                symbol: account.symbol,
                deviceState: account.deviceState,
                flow: 'detail',
            }),
        );
    };

    return (
        <BulletList.Item
            state={state}
            title={
                <Row justifyContent="space-between" alignItems="center" width="100%">
                    <Translation id="TR_EARN_YIELD_SELECT_AMOUNT_AND_APPROVE" />
                    {isDone && onRevoke && (
                        <Button
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            onClick={() => onRevoke()}
                        >
                            <Translation id="TR_REVOKE_DATA_TITLE" />
                        </Button>
                    )}
                </Row>
            }
        >
            {isActive && (
                <Column gap={16}>
                    <YieldAmountCard
                        amount={amount}
                        tokenSymbol={token.symbol}
                        fractionMaxAmount={maxAmount}
                        tokenDecimals={token.decimals}
                        amountError={approveStep.amountError}
                        isDisabled={approve.isAmountInputDisabled}
                        summary={{
                            labelTranslationId: balanceLabelTranslationId,
                            token: balanceToken ?? token,
                            value: summaryValue,
                        }}
                        heading={{
                            amountLabelTranslationId,
                            switchCurrencyLabel,
                            isSwitchDisabled,
                            onSwitchCurrency,
                        }}
                        onAmountChange={onAmountSelect}
                        onFractionClick={onAmountSelect}
                    />

                    {approve.error && (
                        <Banner
                            intent="warning"
                            icon="warning"
                            description={<Translation id={approve.error} />}
                        />
                    )}

                    <Button
                        size="large"
                        width="100%"
                        onClick={onApprove}
                        isLoading={approve.isApproveButtonLoading}
                        isDisabled={approve.isApproveButtonDisabled}
                    >
                        <Translation id="TR_APPROVE_DATA_TITLE" />
                    </Button>

                    {approval.isRevokeRequired && (
                        <Column gap={8} alignItems="flex-start">
                            <Button
                                size="small"
                                intent="neutral"
                                priority="secondary"
                                onClick={() => onRevoke?.()}
                                isDisabled={approve.isApproveButtonLoading}
                            >
                                <Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BUTTON" />
                            </Button>

                            <Banner
                                intent="warning"
                                icon="warning"
                                description={
                                    <Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BANNER" />
                                }
                            />
                        </Column>
                    )}

                    {approval.isPending && (
                        <Column width="100%" alignItems="flex-start" gap={12}>
                            <Row alignItems="center" gap={12}>
                                <Spinner size={20} isDisabled={true} />

                                <Column gap={2}>
                                    <Text
                                        typographyStyle="body-sm"
                                        intent="neutral"
                                        priority="secondary"
                                    >
                                        <Translation
                                            id={
                                                approval.pendingType === 'REVOKE'
                                                    ? 'TR_EXCHANGE_APPROVAL_FORM_REVOKING_APPROVAL'
                                                    : 'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL'
                                            }
                                        />
                                    </Text>

                                    {approvalTxid && (
                                        <Row alignItems="center" gap={4}>
                                            <Text
                                                typographyStyle="body-sm"
                                                intent="neutral"
                                                priority="secondary"
                                            >
                                                <Translation id="TR_EXCHANGE_APPROVAL_FORM_TRANSACTION_ID" />
                                            </Text>
                                            <Link
                                                onClick={() =>
                                                    handleApprovalTxidClick(approvalTxid)
                                                }
                                            >
                                                <Address
                                                    isTruncated
                                                    value={approvalTxid}
                                                    intent="brand"
                                                    typographyStyle="body-sm"
                                                />
                                            </Link>
                                        </Row>
                                    )}
                                </Column>
                            </Row>
                        </Column>
                    )}
                </Column>
            )}
        </BulletList.Item>
    );
};
