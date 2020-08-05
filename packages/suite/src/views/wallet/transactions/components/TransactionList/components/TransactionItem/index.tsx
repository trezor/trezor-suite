/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react';
import styled from 'styled-components';
import { AnimatePresence } from 'framer-motion';
import { Translation } from '@suite-components';
import { variables, colors, Button } from '@trezor/components';
import { isTestnet } from '@wallet-utils/accountUtils';
import TransactionTypeIcon from './components/TransactionTypeIcon';
import TransactionHeading from './components/TransactionHeading';
import { isTxUnknown } from '@wallet-utils/transactionUtils';
import { Target, TokenTransfer, FeeRow } from './components/Target';
import TransactionTimestamp from './components/TransactionTimestamp';
import { WalletAccountTransaction } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    padding: 12px 0px;

    & + & {
        border-top: 1px solid ${colors.NEUE_STROKE_GREY};
    }
`;

const TxTypeIconWrapper = styled.div`
    display: flex;
    margin-right: 24px;
    margin-top: 8px;
    flex: 0;
`;

const Content = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
    flex-direction: column;
    font-variant-numeric: tabular-nums;
`;

const Description = styled.span`
    color: ${colors.NEUE_TYPE_DARK_GREY};
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
`;

const TargetsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
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
}

const TransactionItem = React.memo((props: Props) => {
    const { transaction } = props;
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

    // we are using slightly different layout for 1 targets txs to better match the design
    // the only difference is that crypto amount is in the same row as tx heading/description
    // fiat amount is in the second row along with address
    // multiple targets txs still use more simple layout
    return (
        <Wrapper>
            <TxTypeIconWrapper>
                <TransactionTypeIcon type={transaction.type} isPending={props.isPending} />
            </TxTypeIconWrapper>

            <Content>
                <Description>
                    <TransactionHeading
                        transaction={transaction}
                        isPending={props.isPending}
                        useSingleRowLayout={hasSingleTargetOrTransfer}
                    />
                </Description>
                <NextRow>
                    <TransactionTimestamp transaction={transaction} />
                    <TargetsWrapper>
                        {!isUnknown && !isTokenTransaction && (
                            <>
                                {targets.slice(0, DEFAULT_LIMIT).map((t, i) => (
                                    <Target
                                        key={i}
                                        target={t}
                                        transaction={transaction}
                                        singleRowLayout={hasSingleTargetOrTransfer}
                                        isFirst={i === 0}
                                        isLast={
                                            targets.length > DEFAULT_LIMIT
                                                ? i === DEFAULT_LIMIT - 1
                                                : i === targets.length - 1
                                        }
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
                                                        targets.length > limit + DEFAULT_LIMIT
                                                            ? i === limit - 1
                                                            : i ===
                                                              targets.length - DEFAULT_LIMIT - 1
                                                    }
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
            </Content>
        </Wrapper>
    );
});

export default TransactionItem;
