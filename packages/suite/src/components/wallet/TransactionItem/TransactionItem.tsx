import { memo } from 'react';

import styled from 'styled-components';

import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { AccountTransactionBaseAnchor, useAnchor } from '@suite/router';
import { type AccountType, type Network } from '@suite-common/wallet-config';
import {
    createTargets,
    selectAccountEvmNonceInfo,
    selectIsPhishingTransaction,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { formatNetworkAmount, isTxFeePaid } from '@suite-common/wallet-utils';
import { Button, Icon, Row, Tooltip } from '@trezor/components';
import { OutlineHighlight } from '@trezor/product-components';

import { SUBPAGE_NAV_HEIGHT } from 'src/constants/suite/layout';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { type WalletAccountTransaction } from 'src/types/wallet';

import { EvmBumpFeeTooltip } from './EvmBumpFeeTooltip';
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

type OpenModalParams = {
    flow: 'detail' | 'bump-fee' | 'cancel-transaction';
};

type TransactionItemProps = {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    isActionDisabled?: boolean; // Used in "chained transactions" transaction detail modal
    accountKey: AccountKey;
    network: Network;
    accountType: AccountType;
    disableBumpFee?: boolean;
    index: number;
};

export const TransactionItem = memo(
    ({
        transaction,
        accountKey,
        isActionDisabled,
        isPending,
        network,
        accountType,
        disableBumpFee,
        index,
    }: TransactionItemProps) => {
        const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(transaction.symbol);

        const account = useSelector(selectSelectedAccount) || null;

        const networkFeatures = network.accountTypes[accountType]?.features ?? network.features;

        const dispatch = useDispatch();
        const { anchorRef, shouldHighlight } = useAnchor(
            `${AccountTransactionBaseAnchor}/${transaction.txid}`,
        );

        const { type } = transaction;

        const allOutputs = account !== null ? createTargets({ transaction, account }) : [];

        const fee = formatNetworkAmount(transaction.fee, transaction.symbol);
        const showFeeRow = isTxFeePaid(transaction);

        const isTxCancellable =
            transaction.type !== 'self' &&
            transaction.type !== 'joint' &&
            network.networkType === 'bitcoin';

        const isTxBumpable =
            !isActionDisabled &&
            transaction.rbfParams &&
            networkFeatures?.includes('rbf') &&
            !transaction?.deadline;

        // Nonce bounds are derived once per account (memoized) and shared by every pending
        // TransactionItem, instead of each item subscribing to the full tx list and recomputing.
        const { confirmedNonce, nextNonce } = useSelector(state =>
            selectAccountEvmNonceInfo(state, accountKey),
        );

        const evmNonce =
            network.networkType === 'ethereum' ? transaction.ethereumSpecific?.nonce : undefined;

        // A pending EVM tx can be stuck two ways: its nonce is above the next free nonce (a lower
        // nonce is missing — a gap), or below the confirmed nonce (that slot was already mined by
        // another tx — superseded). Either way it won't confirm; `nextNonce` is the nonce to
        // re-send with to unblock it.
        const pendingEvmNonce = isPending ? evmNonce : undefined;

        const isSuperseded = pendingEvmNonce !== undefined && pendingEvmNonce < confirmedNonce;
        const hasNonceGap = pendingEvmNonce !== undefined && pendingEvmNonce > nextNonce;

        const renderNonceWarning = () => {
            if (isSuperseded)
                return (
                    <Translation
                        id="TR_PENDING_NONCE_SUPERSEDED_WARNING"
                        values={{ nonce: nextNonce }}
                    />
                );
            if (hasNonceGap)
                return (
                    <Translation id="TR_BUMP_FEE_NONCE_GAP_WARNING" values={{ nonce: nextNonce }} />
                );

            return null;
        };
        const nonceWarning = renderNonceWarning();

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
        const { isPhishing: isPhishingTransaction, detectorId: phishingDetectorId } = useSelector(
            state => selectIsPhishingTransaction(state, transaction.txid, accountKey),
        );

        const dataTestBase = `@transaction-item/${index}${
            transaction.deadline ? '/prepending' : ''
        }`;

        return (
            <Wrapper ref={anchorRef} data-testid="@wallet/transaction-item">
                <OutlineHighlight shouldHighlight={shouldHighlight}>
                    <TransactionLayout
                        onClick={() => openTxDetailsModal({ flow: 'detail' })}
                        timestamp={
                            <Row gap={4}>
                                <TransactionTimestamp transaction={transaction} />
                                {nonceWarning && (
                                    <Tooltip content={nonceWarning}>
                                        <Icon name="warning" size={16} intent="warning" />
                                    </Tooltip>
                                )}
                            </Row>
                        }
                        heading={
                            <TransactionHeading
                                transaction={transaction}
                                isPending={isPending}
                                isPhishingTransaction={isPhishingTransaction}
                                phishingDetectorId={phishingDetectorId}
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
                            isTxBumpable && (
                                <Row gap={12}>
                                    <Tooltip
                                        content={
                                            <EvmBumpFeeTooltip
                                                isDisabled={disableBumpFee}
                                                nonce={evmNonce}
                                            />
                                        }
                                        isActive={disableBumpFee || evmNonce !== undefined}
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
                                            size="medium"
                                        >
                                            <Translation id="TR_BUMP_FEE" />
                                        </Button>
                                    </Tooltip>
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
                                            size="medium"
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
