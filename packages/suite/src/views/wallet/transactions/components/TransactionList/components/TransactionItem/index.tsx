/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { AnimatePresence } from 'framer-motion';
import { Translation, HiddenPlaceholder, Sign } from '@suite-components';
import { variables, colors, Button, Link } from '@trezor/components';
import { isTestnet } from '@wallet-utils/accountUtils';
import { getDateWithTimeZone } from '@suite-utils/date';
import TransactionTypeIcon from './components/TransactionTypeIcon';
import { Props } from './Container';
import TransactionHeading from './components/TransactionHeading';
import { isTxUnknown, getTargetAmount, getTxOperation } from '@wallet-utils/transactionUtils';
import {
    Target,
    TokenTransfer,
    FeeRow,
    OneRowTarget,
    OneRowTokenTarget,
} from './components/Target';

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
    align-items: baseline;
`;

const TargetsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
`;

const TimestampLink = styled(Link)`
    display: block;
    font-variant-numeric: tabular-nums;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.57;
    margin-right: 24px;
    white-space: nowrap;
`;

const ExpandButton = styled(Button)`
    justify-content: start;
    align-self: flex-start;
`;

const CryptoAmount = styled.span`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    /* line-height: 1.5; */
    text-transform: uppercase;
    white-space: nowrap;
    flex: 0;
`;

const StyledHiddenPlaceholder = styled(HiddenPlaceholder)`
    /* padding: 8px 0px; row padding */
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

const DEFAULT_LIMIT = 3;

export default React.memo((props: Props) => {
    const { transaction } = props;
    const { symbol, type, blockTime, blockHeight, targets, tokens } = transaction;
    const [limit, setLimit] = useState(0);
    const isTokenTransaction = tokens.length > 0;
    const isUnknown = isTxUnknown(transaction);
    const isExpandable = isTokenTransaction
        ? tokens.length - DEFAULT_LIMIT > 0
        : targets.length - DEFAULT_LIMIT > 0;
    const toExpand = isTokenTransaction
        ? tokens.length - DEFAULT_LIMIT - limit
        : targets.length - DEFAULT_LIMIT - limit;
    const useFiatValues = !isTestnet(symbol);

    if (
        !isUnknown &&
        ((!isTokenTransaction && targets.length === 1) ||
            (isTokenTransaction && tokens.length === 1))
    ) {
        // use slightly different layout for 1 targets txs to better match the design
        // the only difference is that crypto amount is in the same row as tx heading/description
        // fiat amount is in the second row along with address
        // multiple targets txs still use more simple layout
        // TODO: find a better way to share common code
        const target = targets[0];
        const transfer = tokens[0];
        const targetAmount = !isTokenTransaction
            ? getTargetAmount(target, transaction)
            : transfer.amount;
        const symbol = !isTokenTransaction ? transaction.symbol : tokens[0].symbol;
        const operation = getTxOperation(transaction);

        return (
            <Wrapper>
                <TxTypeIconWrapper>
                    <TransactionTypeIcon type={transaction.type} isPending={props.isPending} />
                </TxTypeIconWrapper>

                <Content>
                    <Description>
                        <TransactionHeading transaction={transaction} isPending={props.isPending} />
                        {/* TODO: copy pasted from Target component, maybe extract to separate component? */}
                        <CryptoAmount>
                            {targetAmount && (
                                <StyledHiddenPlaceholder>
                                    {operation && <Sign value={operation} />}
                                    {targetAmount} {symbol}
                                </StyledHiddenPlaceholder>
                            )}
                        </CryptoAmount>
                    </Description>
                    <NextRow>
                        <TimestampLink
                            onClick={() => {
                                props.openModal({
                                    type: 'transaction-detail',
                                    tx: transaction,
                                });
                            }}
                        >
                            {blockHeight !== 0 && blockTime && blockTime > 0 && (
                                <FormattedDate
                                    value={getDateWithTimeZone(blockTime * 1000)}
                                    hour="2-digit"
                                    minute="2-digit"
                                    // hour12={false}
                                />
                            )}
                        </TimestampLink>
                        <TargetsWrapper>
                            {isTokenTransaction ? (
                                <>
                                    <OneRowTokenTarget
                                        transfer={transfer}
                                        transaction={transaction}
                                    />
                                    {type !== 'recv' && transaction.fee !== '0' && (
                                        <FeeRow
                                            transaction={transaction}
                                            useFiatValues={useFiatValues}
                                        />
                                    )}
                                </>
                            ) : (
                                <OneRowTarget target={target} transaction={transaction} />
                            )}
                        </TargetsWrapper>
                    </NextRow>
                </Content>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <TxTypeIconWrapper>
                <TransactionTypeIcon type={transaction.type} isPending={props.isPending} />
            </TxTypeIconWrapper>

            <Content>
                <Description>
                    <TransactionHeading transaction={transaction} isPending={props.isPending} />
                </Description>
                <NextRow>
                    <TimestampLink
                        onClick={() => {
                            props.openModal({
                                type: 'transaction-detail',
                                tx: transaction,
                            });
                        }}
                    >
                        {blockHeight !== 0 && blockTime && blockTime > 0 && (
                            <FormattedDate
                                value={getDateWithTimeZone(blockTime * 1000)}
                                hour="2-digit"
                                minute="2-digit"
                                // hour12={false}
                            />
                        )}
                    </TimestampLink>
                    <TargetsWrapper>
                        {!isUnknown && !isTokenTransaction && (
                            <>
                                {targets.slice(0, DEFAULT_LIMIT).map((t, i) => (
                                    <Target key={i} target={t} transaction={transaction} />
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
                                                />
                                            ))}
                                </AnimatePresence>
                            </>
                        )}

                        {!isUnknown && isTokenTransaction && (
                            <>
                                {tokens.slice(0, DEFAULT_LIMIT).map((t, i) => (
                                    <TokenTransfer key={i} transfer={t} transaction={transaction} />
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
                                                />
                                            ))}
                                </AnimatePresence>
                            </>
                        )}

                        {!isUnknown &&
                            isTokenTransaction &&
                            type !== 'recv' &&
                            transaction.fee !== '0' && (
                                <FeeRow transaction={transaction} useFiatValues={useFiatValues} />
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
