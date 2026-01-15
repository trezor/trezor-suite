import { memo, useMemo, useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { getInstantStakeType } from '@suite-common/staking';
import { AccountType, Network } from '@suite-common/wallet-config';
import { selectIsPhishingTransaction, useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { formatNetworkAmount, isTxFeePaid } from '@suite-common/wallet-utils';
import { Button, Link, Row, Tooltip } from '@trezor/components';
import { HELP_CENTER_REPLACE_BY_FEE_ETHEREUM } from '@trezor/urls';

import { openModal } from 'src/actions/suite/modalActions';
import { OutlineHighlight } from 'src/components/OutlineHighlight';
import { AccountTransactionBaseAnchor } from 'src/constants/suite/anchors';
import { SUBPAGE_NAV_HEIGHT } from 'src/constants/suite/layout';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { AccountLabels } from 'src/types/suite/metadata';
import { WalletAccountTransaction } from 'src/types/wallet';

import { TransactionHeading } from './TransactionHeading';
import { TransactionLayout } from './TransactionLayout';
import { CoinjoinRow, DepositRow, FeeRow, WithdrawalRow } from './TransactionRow';
import { TransactionTimestamp } from '../TransactionTimestamp';
import { TransactionTargetsList } from './TransactionTarget/TransactionTargetsList';
import { TransactionTypeIcon } from './TransactionTypeIcon';

const Wrapper = styled.div`
    /* height of secondary panel and a gap between transactions and graph */
    scroll-margin-top: calc(${SUBPAGE_NAV_HEIGHT} + 115px);
`;

const DEFAULT_LIMIT = 3;

type OpenModalParams = {
    flow: 'detail' | 'bump-fee' | 'cancel-transaction';
};

type TransactionItemProps = {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    isActionDisabled?: boolean; // Used in "chained transactions" transaction detail modal
    accountMetadata?: AccountLabels;
    accountKey: string;
    network: Network;
    accountType: AccountType;
    disableBumpFee?: boolean;
    index: number;
};

export const TransactionItem = memo(
    ({
        transaction,
        accountKey,
        accountMetadata,
        isActionDisabled,
        isPending,
        network,
        accountType,
        disableBumpFee,
        index,
    }: TransactionItemProps) => {
        const [limit, setLimit] = useState(0);
        const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(transaction.symbol);

        const { descriptor: address, symbol } = useSelector(selectSelectedAccount) || {};

        const networkFeatures = network.accountTypes[accountType]?.features ?? network.features;

        const dispatch = useDispatch();
        const { anchorRef, shouldHighlight } = useAnchor(
            `${AccountTransactionBaseAnchor}/${transaction.txid}`,
        );

        const { type, targets, tokens, internalTransfers } = transaction;

        // Filter out internal transfers that are instant staking transactions
        const filteredInternalTransfers = useMemo(
            () =>
                internalTransfers.filter(t => {
                    const stakeType = getInstantStakeType(t, address, symbol);

                    return stakeType !== 'stake';
                }),
            [internalTransfers, address, symbol],
        );

        const fee = formatNetworkAmount(transaction.fee, transaction.symbol);
        const showFeeRow = isTxFeePaid(transaction);

        // join together regular targets, internal and token transfers
        const allOutputs: (
            | { type: 'token'; payload: (typeof tokens)[number] }
            | { type: 'internal'; payload: (typeof filteredInternalTransfers)[number] }
            | { type: 'target'; payload: WalletAccountTransaction['targets'][number] }
        )[] = [
            ...tokens
                .filter(token => token.type !== 'self')
                .map(t => ({ type: 'token' as const, payload: t })),
            ...targets.map(t => ({ type: 'target' as const, payload: t })),
            ...filteredInternalTransfers.map(t => ({ type: 'internal' as const, payload: t })),
        ];

        const isExpandable = allOutputs.length - DEFAULT_LIMIT > 0;
        const toExpand = allOutputs.length - DEFAULT_LIMIT - limit;

        const isTxCancellable =
            transaction.type !== 'self' &&
            transaction.type !== 'joint' &&
            network.networkType === 'bitcoin';

        const isTxBumpable =
            !isActionDisabled &&
            transaction.rbfParams &&
            networkFeatures?.includes('rbf') &&
            !transaction?.deadline;

        const openTxDetailsModal = ({ flow }: OpenModalParams) => {
            if (isActionDisabled) return; // open explorer
            dispatch(
                openModal({
                    type: 'transaction-detail',
                    txid: transaction.txid,
                    descriptor: transaction.descriptor,
                    symbol: transaction.symbol,
                    deviceState: transaction.deviceState,
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

        return (
            <Wrapper ref={anchorRef} data-testid="@wallet/transaction-item">
                <OutlineHighlight shouldHighlight={shouldHighlight}>
                    <TransactionLayout
                        onClick={() => openTxDetailsModal({ flow: 'detail' })}
                        timestamp={<TransactionTimestamp transaction={transaction} />}
                        heading={
                            <TransactionHeading
                                transaction={transaction}
                                isPending={isPending}
                                isPhishingTransaction={isPhishingTransaction}
                                dataTestBase={dataTestBase}
                            />
                        }
                        icon={
                            <TransactionTypeIcon
                                transaction={transaction}
                                isPending={isPending}
                                isPhishingTransaction={isPhishingTransaction}
                            />
                        }
                        actions={
                            (isTxBumpable || isExpandable) && (
                                <Row gap={12}>
                                    {isExpandable && (
                                        <Button
                                            intent="neutral"
                                            priority="secondary"
                                            iconRight={toExpand > 0 ? 'caretDown' : 'caretUp'}
                                            size="small"
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
                                        </Button>
                                    )}
                                    {isTxBumpable && (
                                        <Tooltip
                                            content={
                                                <Translation
                                                    id="TR_BUMP_FEE_DISABLED_TOOLTIP"
                                                    values={{
                                                        a: chunks => (
                                                            <Link
                                                                href={
                                                                    HELP_CENTER_REPLACE_BY_FEE_ETHEREUM
                                                                }
                                                            >
                                                                {chunks}
                                                            </Link>
                                                        ),
                                                    }}
                                                />
                                            }
                                            isActive={disableBumpFee}
                                        >
                                            <Button
                                                intent="neutral"
                                                priority="secondary"
                                                iconLeft="gauge"
                                                onClick={e => {
                                                    openTxDetailsModal({
                                                        flow: 'bump-fee',
                                                    });
                                                    e.stopPropagation();
                                                }}
                                                isDisabled={disableBumpFee}
                                                data-testid="@transaction-item/bump-fee-button"
                                                size="small"
                                            >
                                                <Translation id="TR_BUMP_FEE" />
                                            </Button>
                                        </Tooltip>
                                    )}
                                    {isTxCancellable && (
                                        <Button
                                            intent="neutral"
                                            priority="secondary"
                                            iconLeft="x"
                                            onClick={e => {
                                                openTxDetailsModal({
                                                    flow: 'cancel-transaction',
                                                });
                                                e.stopPropagation();
                                            }}
                                            size="small"
                                        >
                                            <Translation id="TR_CANCEL_TX" />
                                        </Button>
                                    )}
                                </Row>
                            )
                        }
                    >
                        {type !== 'unknown' && type !== 'failed' && allOutputs.length ? (
                            <TransactionTargetsList
                                transaction={transaction}
                                allOutputs={allOutputs}
                                isActionDisabled={isActionDisabled}
                                accountKey={accountKey}
                                accountMetadata={accountMetadata}
                                limit={limit}
                                defaultLimit={DEFAULT_LIMIT}
                                isPhishingTransaction={isPhishingTransaction}
                            />
                        ) : null}

                        {type === 'joint' && (
                            <CoinjoinRow
                                transaction={transaction}
                                useFiatValues={shallDisplayBaseCurrency}
                            />
                        )}

                        {transaction.cardanoSpecific?.withdrawal && (
                            <WithdrawalRow
                                transaction={transaction}
                                useFiatValues={shallDisplayBaseCurrency}
                            />
                        )}

                        {transaction.cardanoSpecific?.deposit && (
                            <DepositRow
                                transaction={transaction}
                                useFiatValues={shallDisplayBaseCurrency}
                            />
                        )}

                        {showFeeRow && (
                            <FeeRow
                                fee={fee}
                                transaction={transaction}
                                useFiatValues={shallDisplayBaseCurrency}
                            />
                        )}
                    </TransactionLayout>
                </OutlineHighlight>
            </Wrapper>
        );
    },
);
