/* eslint-disable react/no-array-index-key */
import { memo, Fragment, useState } from 'react';
import styled, { css } from 'styled-components';
import { AnimatePresence } from 'framer-motion';
import { variables, Button, Card } from '@trezor/components';
import { getIsZeroValuePhishing } from '@suite-common/suite-utils';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { formatNetworkAmount, isTestnet, isTxFeePaid } from '@suite-common/wallet-utils';
import { AccountLabels } from 'src/types/suite/metadata';
import { Network, WalletAccountTransaction } from 'src/types/wallet';
import { TransactionTypeIcon } from './TransactionTypeIcon';
import { TransactionHeading } from './TransactionHeading';
import {
    TransactionTarget,
    TokenTransfer,
    InternalTransfer,
} from './TransactionTarget/TransactionTarget';
import { FeeRow, WithdrawalRow, DepositRow, CoinjoinRow } from './TransactionRow';
import {
    Content,
    Description,
    NextRow,
    TargetsWrapper,
    TimestampWrapper,
    TxTypeIconWrapper,
} from './CommonComponents';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { AccountTransactionBaseAnchor } from 'src/constants/suite/anchors';
import { SECONDARY_PANEL_HEIGHT } from 'src/components/suite/AppNavigation/AppNavigation';
import { anchorOutlineStyles } from 'src/utils/suite/anchor';
import { TransactionTimestamp } from 'src/components/wallet/TransactionTimestamp';

const Wrapper = styled(Card)<{
    isPending: boolean;
    shouldHighlight: boolean;
    isZeroValuePhishing: boolean;
}>`
    display: flex;
    flex-direction: row;
    padding: 0 24px;
    opacity: ${({ isZeroValuePhishing }) => isZeroValuePhishing && 0.6};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0 16px;
    }

    ${({ isPending }) =>
        isPending &&
        css`
            border-left: 8px solid ${({ theme }) => theme.TYPE_ORANGE};
            padding-left: 16px;

            @media (max-width: ${variables.SCREEN_SIZE.SM}) {
                padding: 0 8px;
            }
        `}

    /* height of secondary panel and a gap between transactions and graph */
    scroll-margin-top: calc(${SECONDARY_PANEL_HEIGHT} + 115px);

    ${anchorOutlineStyles}
`;

const Body = styled.div`
    display: flex;
    width: 100%;
    padding: 12px 0;
`;

const ExpandButton = styled(Button)`
    justify-content: flex-start;
    align-self: flex-start;
    margin-top: 8px;
`;

const StyledFeeRow = styled(FeeRow)<{ $noInputsOutputs?: boolean }>`
    margin-top: ${({ $noInputsOutputs }) => ($noInputsOutputs ? '0px' : '20px')};
`;

const DEFAULT_LIMIT = 3;

interface TransactionItemProps {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    isActionDisabled?: boolean; // Used in "chained transactions" transaction detail modal
    accountMetadata?: AccountLabels;
    accountKey: string;
    network: Network;
    className?: string;
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
        className,
        index,
    }: TransactionItemProps) => {
        const [limit, setLimit] = useState(0);
        const [txItemIsHovered, setTxItemIsHovered] = useState(false);
        const [nestedItemIsHovered, setNestedItemIsHovered] = useState(false);

        const dispatch = useDispatch();
        const { anchorRef, shouldHighlight } = useAnchor(
            `${AccountTransactionBaseAnchor}/${transaction.txid}`,
        );

        const { type, targets, tokens, internalTransfers } = transaction;
        const isUnknown = type === 'unknown';
        const useFiatValues = !isTestnet(transaction.symbol);
        const useSingleRowLayout =
            !isUnknown &&
            (targets.length === 1 || transaction.type === 'self') &&
            !tokens.length &&
            !internalTransfers.length &&
            transaction.cardanoSpecific?.subtype !== 'withdrawal' &&
            transaction.cardanoSpecific?.subtype !== 'stake_registration';
        const noInputsOutputs =
            (!tokens.length && !internalTransfers.length && !targets.length) || type === 'failed';

        const fee = formatNetworkAmount(transaction.fee, transaction.symbol);
        const showFeeRow = isTxFeePaid(transaction);

        // join together regular targets, internal and token transfers
        const allOutputs: (
            | { type: 'token'; payload: (typeof tokens)[number] }
            | { type: 'internal'; payload: (typeof internalTransfers)[number] }
            | { type: 'target'; payload: WalletAccountTransaction['targets'][number] }
        )[] = [
            ...targets.map(t => ({ type: 'target' as const, payload: t })),
            ...internalTransfers.map(t => ({ type: 'internal' as const, payload: t })),
            ...tokens.map(t => ({ type: 'token' as const, payload: t })),
        ];

        const previewTargets = allOutputs.slice(0, DEFAULT_LIMIT);
        const isExpandable = allOutputs.length - DEFAULT_LIMIT > 0;
        const toExpand = allOutputs.length - DEFAULT_LIMIT - limit;

        const openTxDetailsModal = (rbfForm?: boolean) => {
            if (isActionDisabled) return; // open explorer
            dispatch(
                openModal({
                    type: 'transaction-detail',
                    tx: transaction,
                    rbfForm,
                }),
            );
        };

        const isZeroValuePhishing = getIsZeroValuePhishing(transaction);
        const dataTestBase = `@transaction-item/${index}${
            transaction.deadline ? '/prepending' : ''
        }`;

        // we are using slightly different layout for 1 targets txs to better match the design
        // the only difference is that crypto amount is in the same row as tx heading/description
        // fiat amount is in the second row along with address
        // multiple targets txs still use more simple layout
        return (
            <Wrapper
                onMouseEnter={() => setTxItemIsHovered(true)}
                onMouseLeave={() => setTxItemIsHovered(false)}
                isPending={isPending}
                ref={anchorRef}
                shouldHighlight={shouldHighlight}
                isZeroValuePhishing={isZeroValuePhishing}
                className={className}
            >
                <Body>
                    <TxTypeIconWrapper
                        onMouseEnter={() => setNestedItemIsHovered(true)}
                        onMouseLeave={() => setNestedItemIsHovered(false)}
                        onClick={() => openTxDetailsModal()}
                    >
                        <TransactionTypeIcon type={transaction.type} isPending={isPending} />
                    </TxTypeIconWrapper>

                    <Content>
                        <Description>
                            <TransactionHeading
                                transaction={transaction}
                                isPending={isPending}
                                useSingleRowLayout={useSingleRowLayout}
                                txItemIsHovered={txItemIsHovered}
                                nestedItemIsHovered={nestedItemIsHovered}
                                onClick={() => openTxDetailsModal()}
                                dataTestBase={dataTestBase}
                            />
                        </Description>
                        <NextRow>
                            <TimestampWrapper
                                onMouseEnter={() => setNestedItemIsHovered(true)}
                                onMouseLeave={() => setNestedItemIsHovered(false)}
                                onClick={() => openTxDetailsModal()}
                            >
                                <TransactionTimestamp transaction={transaction} />
                            </TimestampWrapper>
                            <TargetsWrapper>
                                {!isUnknown && type !== 'failed' && previewTargets.length ? (
                                    <>
                                        {previewTargets.map((t, i) => (
                                            <Fragment key={i}>
                                                {t.type === 'target' && (
                                                    <TransactionTarget
                                                        // render first n targets, n = DEFAULT_LIMIT
                                                        target={t.payload}
                                                        transaction={transaction}
                                                        singleRowLayout={useSingleRowLayout}
                                                        isFirst={i === 0}
                                                        isLast={
                                                            limit > 0
                                                                ? false
                                                                : i === previewTargets.length - 1
                                                        } // if list of targets is expanded we won't get last item here
                                                        accountMetadata={accountMetadata}
                                                        accountKey={accountKey}
                                                        isActionDisabled={isActionDisabled}
                                                    />
                                                )}
                                                {t.type === 'token' && (
                                                    <TokenTransfer
                                                        transfer={t.payload}
                                                        transaction={transaction}
                                                        singleRowLayout={useSingleRowLayout}
                                                        isFirst={i === 0}
                                                        isLast={
                                                            limit > 0
                                                                ? false
                                                                : i === previewTargets.length - 1
                                                        }
                                                    />
                                                )}
                                                {t.type === 'internal' && (
                                                    <InternalTransfer
                                                        transfer={t.payload}
                                                        transaction={transaction}
                                                        singleRowLayout={useSingleRowLayout}
                                                        isFirst={i === 0}
                                                        isLast={
                                                            limit > 0
                                                                ? false
                                                                : i === previewTargets.length - 1
                                                        }
                                                    />
                                                )}
                                            </Fragment>
                                        ))}
                                        <AnimatePresence initial={false}>
                                            {limit > 0 &&
                                                allOutputs
                                                    .slice(DEFAULT_LIMIT, DEFAULT_LIMIT + limit)
                                                    .map((t, i) => (
                                                        <Fragment key={i}>
                                                            {t.type === 'target' && (
                                                                <TransactionTarget
                                                                    target={t.payload}
                                                                    transaction={transaction}
                                                                    useAnimation
                                                                    isLast={
                                                                        // if list is not fully expanded, an index of last is limit (num of currently showed items) - 1,
                                                                        // otherwise the index is calculated as num of all targets - num of targets that are always shown (DEFAULT_LIMIT) - 1
                                                                        allOutputs.length >
                                                                        limit + DEFAULT_LIMIT
                                                                            ? i === limit - 1
                                                                            : i ===
                                                                              allOutputs.length -
                                                                                  DEFAULT_LIMIT -
                                                                                  1
                                                                    }
                                                                    accountMetadata={
                                                                        accountMetadata
                                                                    }
                                                                    accountKey={accountKey}
                                                                />
                                                            )}
                                                            {t.type === 'token' && (
                                                                <TokenTransfer
                                                                    transfer={t.payload}
                                                                    transaction={transaction}
                                                                    useAnimation
                                                                    isLast={
                                                                        i ===
                                                                        allOutputs.length -
                                                                            DEFAULT_LIMIT -
                                                                            1
                                                                    }
                                                                />
                                                            )}
                                                            {t.type === 'internal' && (
                                                                <InternalTransfer
                                                                    transfer={t.payload}
                                                                    transaction={transaction}
                                                                    useAnimation
                                                                    isLast={
                                                                        i ===
                                                                        allOutputs.length -
                                                                            DEFAULT_LIMIT -
                                                                            1
                                                                    }
                                                                />
                                                            )}
                                                        </Fragment>
                                                    ))}
                                        </AnimatePresence>
                                    </>
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
                                    <StyledFeeRow
                                        fee={fee}
                                        transaction={transaction}
                                        useFiatValues={useFiatValues}
                                        $noInputsOutputs={noInputsOutputs}
                                        isFirst
                                        isLast
                                    />
                                )}

                                {isExpandable && (
                                    <ExpandButton
                                        variant="tertiary"
                                        icon={toExpand > 0 ? 'ARROW_DOWN' : 'ARROW_UP'}
                                        alignIcon="right"
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
                            </TargetsWrapper>
                        </NextRow>
                        {!isActionDisabled &&
                            transaction.rbfParams &&
                            network.features?.includes('rbf') &&
                            !transaction?.deadline && (
                                <NextRow>
                                    <Button
                                        variant="tertiary"
                                        onClick={() => openTxDetailsModal(true)}
                                    >
                                        <Translation id="TR_BUMP_FEE" />
                                    </Button>
                                </NextRow>
                            )}
                    </Content>
                </Body>
            </Wrapper>
        );
    },
);
