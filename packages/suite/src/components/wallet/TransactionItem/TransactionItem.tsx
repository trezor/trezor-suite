import { memo } from 'react';

import styled from 'styled-components';

import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { AccountTransactionBaseAnchor, useAnchor } from '@suite/router';
import { type AccountType, type Network } from '@suite-common/wallet-config';
import {
    createTargets,
    selectAccountByKey,
    selectIsPhishingTransaction,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    getPendingEvmNonceStatus,
    isSentTransaction,
    isTransactionBumpable,
    isTransactionCancellable,
    isTxFeePaid,
} from '@suite-common/wallet-utils';
import { Button, Icon, Row, Tooltip } from '@trezor/components';
import { GaugeIcon, WarningIcon, XIcon } from '@trezor/icons';
import { OutlineHighlight } from '@trezor/product-components';

import { SUBPAGE_NAV_HEIGHT } from 'src/constants/suite/layout';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useEvmNonceInfo } from 'src/hooks/wallet/useEvmNonceInfo';
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

        const isTxCancellable = isTransactionCancellable(transaction, isPending, networkFeatures);

        const isTxBumpable =
            !isActionDisabled && isTransactionBumpable(transaction, networkFeatures);

        // Fetched once (on mount) from the backend rather than derived from the account's local
        // sync state, so a stuck/gapped nonce is found using the account's real confirmed nonce as
        // the counting base instead of local data that can itself be incomplete or stale — see
        // useEvmNonceInfo.
        const rawNonceAccount = useSelector(state => selectAccountByKey(state, accountKey));
        const nonceAccount =
            rawNonceAccount?.networkType === 'ethereum' ? rawNonceAccount : undefined;
        const { nonceInfo: fetchedNonceInfo } = useEvmNonceInfo(nonceAccount);

        const evmNonce =
            network.networkType === 'ethereum' ? transaction.ethereumSpecific?.nonce : undefined;

        // Gated on `isSentTransaction` to match the filter `getEvmNonceInfo` uses when building
        // `fetchedNonceInfo` — a tx type it doesn't count (e.g. a pending contract deployment)
        // isn't reflected in those bounds, so comparing its nonce against them would produce a
        // false gap/superseded reading.
        const pendingEvmNonce = isPending && isSentTransaction(transaction) ? evmNonce : undefined;

        // A pending EVM tx can be stuck two ways: its nonce is above the next free nonce (a lower
        // nonce is missing — a gap), or below the confirmed nonce (that slot was already mined by
        // another tx — superseded). Either way it won't confirm; `nextNonce` is the nonce to
        // re-send with to unblock it.
        const nonceStatus =
            pendingEvmNonce !== undefined && fetchedNonceInfo
                ? getPendingEvmNonceStatus(pendingEvmNonce, fetchedNonceInfo)
                : 'ok';

        // Bumping the fee, or cancelling, both re-send at this same nonce, which does nothing when
        // that nonce can never confirm (gapped) or already did under another tx (superseded) — a
        // cancel attempt on a superseded nonce would just be rejected by the network as "nonce too
        // low".
        const isBumpFeeDisabled = disableBumpFee || nonceStatus !== 'ok';
        const isCancelDisabled = nonceStatus !== 'ok';

        const renderNonceWarning = () => {
            if (nonceStatus === 'ok' || !fetchedNonceInfo) return null;

            const values = { nonce: fetchedNonceInfo.nextNonce };
            if (nonceStatus === 'superseded')
                return <Translation id="TR_PENDING_NONCE_SUPERSEDED_WARNING" values={values} />;

            return <Translation id="TR_BUMP_FEE_NONCE_GAP_WARNING" values={values} />;
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
                    // The tx list is the only entry point that reflects a cancel; enable the button here.
                    showCancelButton: true,
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
                                        <Icon as={WarningIcon} size={16} intent="warning" />
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
                            (isTxBumpable || isTxCancellable) && (
                                <Row gap={12}>
                                    {isTxBumpable && (
                                        <Tooltip
                                            content={
                                                <EvmBumpFeeTooltip
                                                    isDisabled={isBumpFeeDisabled}
                                                    nonce={evmNonce}
                                                />
                                            }
                                            isActive={isBumpFeeDisabled || evmNonce !== undefined}
                                        >
                                            <Button
                                                intent="neutral"
                                                priority="secondary"
                                                iconLeft={GaugeIcon}
                                                onClick={e => {
                                                    openTxDetailsModal({
                                                        flow: 'bump-fee',
                                                    });
                                                    e.stopPropagation();
                                                }}
                                                isDisabled={isBumpFeeDisabled}
                                                data-testid="@transaction-item/bump-fee-button"
                                                size="medium"
                                            >
                                                <Translation id="TR_BUMP_FEE" />
                                            </Button>
                                        </Tooltip>
                                    )}
                                    {isTxCancellable && (
                                        <Button
                                            intent="neutral"
                                            priority="secondary"
                                            iconLeft={XIcon}
                                            onClick={e => {
                                                openTxDetailsModal({
                                                    flow: 'cancel-transaction',
                                                });
                                                e.stopPropagation();
                                            }}
                                            isDisabled={isCancelDisabled}
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
