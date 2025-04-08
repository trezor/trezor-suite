import { memo, useMemo, useState } from 'react';

import styled from 'styled-components';

import { AccountType, Network } from '@suite-common/wallet-config';
import { selectIsPhishingTransaction } from '@suite-common/wallet-core';
import {
    formatNetworkAmount,
    isStakeTypeTx,
    isTestnet,
    isTxFeePaid,
} from '@suite-common/wallet-utils';
import { Button, Card, Column, Link, Row, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_REPLACE_BY_FEE_ETHEREUM } from '@trezor/urls';

import { openModal } from 'src/actions/suite/modalActions';
import { OutlineHighlight } from 'src/components/OutlineHighlight';
import { Translation } from 'src/components/suite';
import { TransactionTimestamp } from 'src/components/wallet/TransactionTimestamp';
import { AccountTransactionBaseAnchor } from 'src/constants/suite/anchors';
import { SUBPAGE_NAV_HEIGHT } from 'src/constants/suite/layout';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { AccountLabels } from 'src/types/suite/metadata';
import { WalletAccountTransaction } from 'src/types/wallet';
import { getInstantStakeType } from 'src/utils/suite/ethereumStaking';

import { Content, TimestampWrapper, TxTypeIconWrapper } from './CommonComponents';
import { TransactionHeading } from './TransactionHeading';
import { BlurWrapper } from './TransactionItemBlurWrapper';
import { CoinjoinRow, DepositRow, FeeRow, WithdrawalRow } from './TransactionRow';
import { TransactionTargetsList } from './TransactionTarget/TransactionTargetsList';
import { TransactionTypeIcon } from './TransactionTypeIcon';

const Wrapper = styled.div<{
    $isPhishingTransaction: boolean;
}>`
    opacity: ${({ $isPhishingTransaction }) => $isPhishingTransaction && 0.6};

    /* height of secondary panel and a gap between transactions and graph */
    scroll-margin-top: calc(${SUBPAGE_NAV_HEIGHT} + 115px);
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const ExpandButton = styled(Button)`
    justify-content: flex-start;
    align-self: flex-start;
    margin-top: 8px;
`;

const StyledFeeRow = styled(FeeRow)<{ $noInputsOutputs?: boolean }>`
    margin-top: ${({ $noInputsOutputs }) => ($noInputsOutputs ? '0px' : '20px')};
`;

const DEFAULT_LIMIT = 3;

type OpenModalParams = {
    flow: 'detail' | 'bump-fee' | 'cancel-transaction';
};

interface TransactionItemProps {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    isActionDisabled?: boolean; // Used in "chained transactions" transaction detail modal
    accountMetadata?: AccountLabels;
    accountKey: string;
    network: Network;
    accountType: AccountType;
    className?: string;
    disableBumpFee?: boolean;
    index: number;
}

export const TransactionItem = memo(
    ({
        transaction,
        accountKey,
        accountMetadata,
        isActionDisabled,
        isPending,
        network,
        accountType,
        className,
        disableBumpFee,
        index,
    }: TransactionItemProps) => {
        const [limit, setLimit] = useState(0);
        const [txItemIsHovered, setTxItemIsHovered] = useState(false);
        const [nestedItemIsHovered, setNestedItemIsHovered] = useState(false);

        const { descriptor: address, symbol } = useSelector(selectSelectedAccount) || {};

        const networkFeatures = network.accountTypes[accountType]?.features ?? network.features;

        const dispatch = useDispatch();
        const { anchorRef, shouldHighlight } = useAnchor(
            `${AccountTransactionBaseAnchor}/${transaction.txid}`,
        );

        const { type, targets, tokens, internalTransfers, ethereumSpecific } = transaction;

        const txSignature = ethereumSpecific?.parsedData?.methodId;

        const isUnknown = type === 'unknown';

        // Filter out internal transfers that are instant staking transactions
        const filteredInternalTransfers = useMemo(
            () =>
                internalTransfers.filter(t => {
                    const stakeType = getInstantStakeType(t, address, symbol);

                    return stakeType !== 'stake';
                }),
            [internalTransfers, address, symbol],
        );

        const isStakingTx: boolean = useMemo(() => isStakeTypeTx(txSignature), [txSignature]);

        const useFiatValues = !isTestnet(transaction.symbol);
        const useSingleRowLayout =
            !isUnknown &&
            !isStakingTx &&
            (targets.length === 1 || transaction.type === 'self') &&
            !tokens.length &&
            !filteredInternalTransfers.length &&
            transaction.cardanoSpecific?.subtype !== 'withdrawal' &&
            transaction.cardanoSpecific?.subtype !== 'stake_registration';

        const noInputsOutputs =
            (!tokens.length && !filteredInternalTransfers.length && !targets.length) ||
            type === 'failed';

        const fee = formatNetworkAmount(transaction.fee, transaction.symbol);
        const showFeeRow = isTxFeePaid(transaction);

        // join together regular targets, internal and token transfers
        const allOutputs: (
            | { type: 'token'; payload: (typeof tokens)[number] }
            | { type: 'internal'; payload: (typeof filteredInternalTransfers)[number] }
            | { type: 'target'; payload: WalletAccountTransaction['targets'][number] }
        )[] = [
            ...targets.map(t => ({ type: 'target' as const, payload: t })),
            ...filteredInternalTransfers.map(t => ({ type: 'internal' as const, payload: t })),
            ...tokens.map(t => ({ type: 'token' as const, payload: t })),
        ];

        const isExpandable = allOutputs.length - DEFAULT_LIMIT > 0;
        const toExpand = allOutputs.length - DEFAULT_LIMIT - limit;

        const isTxCancellable = transaction.type !== 'self' && network.networkType === 'bitcoin';

        const openTxDetailsModal = ({ flow }: OpenModalParams) => {
            if (isActionDisabled) return; // open explorer
            dispatch(
                openModal({
                    type: 'transaction-detail',
                    tx: { ...transaction, internalTransfers: filteredInternalTransfers },
                    flow,
                }),
            );
        };
        const isPhishingTransaction = useSelector(state =>
            selectIsPhishingTransaction(state, transaction.txid, accountKey),
        );

        const dataTestBase = `@transaction-item/${index}${
            transaction.deadline ? '/prepending' : ''
        }`;

        const BumpFeeButton = ({ isDisabled }: { isDisabled: boolean }) => (
            <Button
                variant="tertiary"
                icon="gauge"
                onClick={() => openTxDetailsModal({ flow: 'bump-fee' })}
                isDisabled={isDisabled}
            >
                <Translation id="TR_BUMP_FEE" />
            </Button>
        );

        const CancelTransactionButton = ({ isDisabled }: { isDisabled: boolean }) => (
            <Button
                variant="tertiary"
                icon="x"
                onClick={() => openTxDetailsModal({ flow: 'cancel-transaction' })}
                isDisabled={isDisabled}
            >
                <Translation id="TR_CANCEL_TX" />
            </Button>
        );

        const DisabledBumpFeeButtonWithTooltip = () => (
            <Tooltip
                content={
                    <div>
                        <Translation
                            id="TR_BUMP_FEE_DISABLED_TOOLTIP"
                            values={{
                                a: chunks => (
                                    <Link
                                        href={HELP_CENTER_REPLACE_BY_FEE_ETHEREUM}
                                        variant="nostyle"
                                        icon="arrowUpRight"
                                        typographyStyle="hint"
                                    >
                                        {chunks}
                                    </Link>
                                ),
                            }}
                        />
                    </div>
                }
            >
                <BumpFeeButton isDisabled={true} />
            </Tooltip>
        );

        // we are using slightly different layout for 1 targets txs to better match the design
        // the only difference is that crypto amount is in the same row as tx heading/description
        // fiat amount is in the second row along with address
        // multiple targets txs still use more simple layout
        return (
            <Wrapper
                onMouseEnter={() => setTxItemIsHovered(true)}
                onMouseLeave={() => setTxItemIsHovered(false)}
                ref={anchorRef}
                $isPhishingTransaction={isPhishingTransaction}
                className={className}
                data-testid="@wallet/transaction-item"
            >
                <Card variant={isPending ? 'warning' : undefined}>
                    <OutlineHighlight shouldHighlight={shouldHighlight}>
                        <Row>
                            <TxTypeIconWrapper
                                onMouseEnter={() => setNestedItemIsHovered(true)}
                                onMouseLeave={() => setNestedItemIsHovered(false)}
                                onClick={() => openTxDetailsModal({ flow: 'detail' })}
                            >
                                <TransactionTypeIcon
                                    type={transaction.type}
                                    isPending={isPending}
                                />
                            </TxTypeIconWrapper>

                            <Content>
                                <Row justifyContent="space-between" overflow="hidden">
                                    <TransactionHeading
                                        transaction={transaction}
                                        isPending={isPending}
                                        useSingleRowLayout={useSingleRowLayout}
                                        txItemIsHovered={txItemIsHovered}
                                        nestedItemIsHovered={nestedItemIsHovered}
                                        onClick={() => openTxDetailsModal({ flow: 'detail' })}
                                        isPhishingTransaction={isPhishingTransaction}
                                        dataTestBase={dataTestBase}
                                    />
                                </Row>
                                <Row
                                    flex="1"
                                    alignItems="flex-start"
                                    margin={{ bottom: spacings.xxs }}
                                >
                                    <TimestampWrapper
                                        onMouseEnter={() => setNestedItemIsHovered(true)}
                                        onMouseLeave={() => setNestedItemIsHovered(false)}
                                        onClick={() => openTxDetailsModal({ flow: 'detail' })}
                                    >
                                        <TransactionTimestamp transaction={transaction} />
                                    </TimestampWrapper>
                                    <Column flex="1" overflow="hidden">
                                        {!isUnknown && type !== 'failed' && allOutputs.length ? (
                                            <TransactionTargetsList
                                                transaction={transaction}
                                                allOutputs={allOutputs}
                                                isPhishingTransaction={isPhishingTransaction}
                                                isActionDisabled={isActionDisabled}
                                                useSingleRowLayout={useSingleRowLayout}
                                                accountKey={accountKey}
                                                accountMetadata={accountMetadata}
                                                limit={limit}
                                                defaultLimit={DEFAULT_LIMIT}
                                            />
                                        ) : null}

                                        {type === 'joint' && (
                                            <CoinjoinRow
                                                transaction={transaction}
                                                useFiatValues={useFiatValues}
                                            />
                                        )}

                                        {transaction.cardanoSpecific?.withdrawal && (
                                            <WithdrawalRow
                                                transaction={transaction}
                                                useFiatValues={useFiatValues}
                                                isFirst
                                                isLast
                                            />
                                        )}

                                        {transaction.cardanoSpecific?.deposit && (
                                            <DepositRow
                                                transaction={transaction}
                                                useFiatValues={useFiatValues}
                                                isFirst
                                                isLast
                                            />
                                        )}

                                        {showFeeRow && (
                                            <BlurWrapper $isBlurred={isPhishingTransaction}>
                                                <StyledFeeRow
                                                    fee={fee}
                                                    transaction={transaction}
                                                    useFiatValues={useFiatValues}
                                                    $noInputsOutputs={noInputsOutputs}
                                                    isFirst
                                                    isLast
                                                />
                                            </BlurWrapper>
                                        )}

                                        {isExpandable && (
                                            <ExpandButton
                                                variant="tertiary"
                                                icon={toExpand > 0 ? 'caretDown' : 'caretUp'}
                                                iconAlignment="end"
                                                onClick={e => {
                                                    setLimit(toExpand > 0 ? limit + 20 : 0);
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <Translation
                                                    id={
                                                        toExpand > 0
                                                            ? 'TR_SHOW_MORE_ADDRESSES'
                                                            : 'TR_SHOW_LESS'
                                                    }
                                                    values={{ count: toExpand }}
                                                />
                                            </ExpandButton>
                                        )}
                                    </Column>
                                </Row>
                                {!isActionDisabled &&
                                    transaction.rbfParams &&
                                    networkFeatures?.includes('rbf') &&
                                    !transaction?.deadline && (
                                        <Row
                                            flex="1"
                                            alignItems="flex-start"
                                            margin={{ bottom: spacings.xxs }}
                                            gap={spacings.sm}
                                        >
                                            {disableBumpFee ? (
                                                <DisabledBumpFeeButtonWithTooltip />
                                            ) : (
                                                <BumpFeeButton isDisabled={false} />
                                            )}
                                            {isTxCancellable && (
                                                <CancelTransactionButton isDisabled={false} />
                                            )}
                                        </Row>
                                    )}
                            </Content>
                        </Row>
                    </OutlineHighlight>
                </Card>
            </Wrapper>
        );
    },
);
