/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { AnimatePresence } from 'framer-motion';
import { variables, Button } from '@trezor/components';
import { Translation, HiddenPlaceholder } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import { isTestnet } from '@wallet-utils/accountUtils';
import { isTxUnknown } from '@wallet-utils/transactionUtils';
import { AccountMetadata } from '@suite-types/metadata';
import { WalletAccountTransaction } from '@wallet-types';
// local
import TransactionTypeIcon from './components/TransactionTypeIcon';
import TransactionHeading from './components/TransactionHeading';
import { MIN_ROW_HEIGHT } from './components/BaseTargetLayout';
import { Target, TokenTransfer, FeeRow } from './components/Target';
import TransactionTimestamp from './components/TransactionTimestamp';

const Wrapper = styled.div<{ chainedTxMode?: boolean }>`
    display: flex;
    flex-direction: row;
    padding: 12px 0px;

    ${props =>
        props.chainedTxMode
            ? css`
                  width: 100%;
                  padding: 12px 16px;
                  cursor: pointer;
                  &:hover {
                      border-radius: 6px;
                      background: ${props => props.theme.BG_GREY};
                  }
              `
            : css`
                  & + & {
                      border-top: 1px solid ${props => props.theme.STROKE_GREY};
                  }
              `}
`;

const TxTypeIconWrapper = styled.div`
    display: flex;
    padding-right: 24px;
    margin-top: 8px;
    flex: 0;
    cursor: pointer;
`;

const TimestampWrapper = styled.div`
    display: flex;
    height: ${MIN_ROW_HEIGHT};
    align-items: center;
`;

const Content = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
    padding: 10px;
    margin: -10px;
    flex-direction: column;
    font-variant-numeric: tabular-nums;
`;

const Description = styled(props => <HiddenPlaceholder {...props} />)`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.5;
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    white-space: nowrap;
`;

const NextRow = styled.div`
    display: flex;
    flex: 1;
    align-items: flex-start;
    & > * + * {
        margin-bottom: 6px;
    }
`;

const TargetsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    padding-right: 10px;
    margin-right: -10px;
`;

const ExpandButton = styled(Button)`
    justify-content: start;
    align-self: flex-start;
`;

const StyledFeeRow = styled(FeeRow)`
    margin-top: 20px;
`;

const DEFAULT_LIMIT = 3;

interface Props {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    isActionDisabled?: boolean; // Used in "chained transactions" transaction detail modal
    accountMetadata?: AccountMetadata;
    accountKey: string;
}

const TransactionItem = React.memo((props: Props) => {
    const { transaction, accountKey, accountMetadata, isActionDisabled } = props;
    const { type, targets, tokens } = transaction;
    const [limit, setLimit] = useState(0);
    const isTokenTransaction = tokens.length > 0;
    const isUnknown = isTxUnknown(transaction);
    const isExpandable = isTokenTransaction
        ? tokens.length - DEFAULT_LIMIT > 0
        : targets.length - DEFAULT_LIMIT > 0;
    const toExpand = isTokenTransaction
        ? tokens.length - DEFAULT_LIMIT - limit
        : targets.length - DEFAULT_LIMIT - limit;
    const useFiatValues = !isTestnet(transaction.symbol);
    const hasSingleTargetOrTransfer =
        !isUnknown &&
        ((!isTokenTransaction && targets.length === 1) ||
            (isTokenTransaction && tokens.length === 1));
    const showFeeRow =
        !isUnknown && isTokenTransaction && type !== 'recv' && transaction.fee !== '0';
    const [txItemIsHovered, setTxItemIsHovered] = useState(false);
    const [nestedItemIsHovered, setNestedItemIsHovered] = useState(false);

    const previewTargets = targets.slice(0, DEFAULT_LIMIT);

    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });
    const openTxDetailsModal = (rbfForm?: boolean) => {
        if (isActionDisabled) return; // open explorer
        openModal({
            type: 'transaction-detail',
            tx: transaction,
            rbfForm,
        });
    };
    // we are using slightly different layout for 1 targets txs to better match the design
    // the only difference is that crypto amount is in the same row as tx heading/description
    // fiat amount is in the second row along with address
    // multiple targets txs still use more simple layout
    return (
        <Wrapper
            onMouseEnter={() => setTxItemIsHovered(true)}
            onMouseLeave={() => setTxItemIsHovered(false)}
            chainedTxMode={isActionDisabled}
        >
            <TxTypeIconWrapper
                onMouseEnter={() => setNestedItemIsHovered(true)}
                onMouseLeave={() => setNestedItemIsHovered(false)}
                onClick={() => openTxDetailsModal()}
            >
                <TransactionTypeIcon type={type} isPending={props.isPending} />
            </TxTypeIconWrapper>

            <Content>
                <Description>
                    <TransactionHeading
                        transaction={transaction}
                        isPending={props.isPending}
                        useSingleRowLayout={hasSingleTargetOrTransfer}
                        txItemIsHovered={txItemIsHovered}
                        nestedItemIsHovered={nestedItemIsHovered}
                        onClick={() => openTxDetailsModal()}
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
                        {!isUnknown && type !== 'failed' && !isTokenTransaction && (
                            <>
                                {previewTargets.map((t, i) => (
                                    // render first n targets, n = DEFAULT_LIMIT
                                    <Target
                                        key={i}
                                        target={t}
                                        transaction={transaction}
                                        singleRowLayout={hasSingleTargetOrTransfer}
                                        isFirst={i === 0}
                                        isLast={limit > 0 ? false : i === previewTargets.length - 1} // if list of targets is expanded we won't get last item here
                                        accountMetadata={accountMetadata}
                                        accountKey={accountKey}
                                        isActionDisabled={isActionDisabled}
                                    />
                                ))}
                                <AnimatePresence initial={false}>
                                    {limit > 0 &&
                                        targets
                                            .slice(DEFAULT_LIMIT, DEFAULT_LIMIT + limit)
                                            .map((t, i) => (
                                                <Target
                                                    key={i}
                                                    target={t}
                                                    transaction={transaction}
                                                    useAnimation
                                                    isLast={
                                                        // if list is not fully expanded, an index of last is limit (num of currently showed items) - 1,
                                                        // otherwise the index is calculated as num of all targets - num of targets that are always shown (DEFAULT_LIMIT) - 1
                                                        targets.length > limit + DEFAULT_LIMIT
                                                            ? i === limit - 1
                                                            : i ===
                                                              targets.length - DEFAULT_LIMIT - 1
                                                    }
                                                    accountMetadata={accountMetadata}
                                                    accountKey={accountKey}
                                                />
                                            ))}
                                </AnimatePresence>
                            </>
                        )}

                        {!isUnknown && isTokenTransaction && (
                            <>
                                {tokens.slice(0, DEFAULT_LIMIT).map((t, i) => (
                                    <TokenTransfer
                                        key={i}
                                        transfer={t}
                                        transaction={transaction}
                                        singleRowLayout={hasSingleTargetOrTransfer}
                                        isFirst={i === 0}
                                        isLast={i === tokens.length - 1}
                                    />
                                ))}
                                <AnimatePresence initial={false}>
                                    {limit > 0 &&
                                        tokens
                                            .slice(DEFAULT_LIMIT, DEFAULT_LIMIT + limit)
                                            .map((t, i) => (
                                                <TokenTransfer
                                                    key={i}
                                                    transfer={t}
                                                    transaction={transaction}
                                                    useAnimation
                                                    isLast={i === tokens.length - 1}
                                                />
                                            ))}
                                </AnimatePresence>
                            </>
                        )}

                        {showFeeRow && (
                            <StyledFeeRow
                                transaction={transaction}
                                useFiatValues={useFiatValues}
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
                                    id={toExpand > 0 ? 'TR_SHOW_MORE_ADDRESSES' : 'TR_SHOW_LESS'}
                                    values={{ count: toExpand }}
                                />
                            </ExpandButton>
                        )}
                    </TargetsWrapper>
                </NextRow>
                {!isActionDisabled && transaction.rbfParams && (
                    <NextRow>
                        <Button variant="tertiary" onClick={() => openTxDetailsModal(true)}>
                            <Translation id="TR_BUMP_FEE" />
                        </Button>
                    </NextRow>
                )}
            </Content>
        </Wrapper>
    );
});

export default TransactionItem;
