import React, { useState } from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Translation, HiddenPlaceholder, FiatValue, AddressLabeling } from '@suite-components';
import { variables, colors, Button, Link } from '@trezor/components';
import { isTestnet } from '@wallet-utils/accountUtils';
import { ArrayElement } from '@suite/types/utils';

import { getDateWithTimeZone } from '@suite-utils/date';
import TransactionTypeIcon from './components/TransactionTypeIcon';
import { Props } from './Container';
import { WalletAccountTransaction } from '@wallet-types';
import Sign from '@suite/components/suite/Sign';

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
    margin-top: 12px;
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
`;

const CryptoAmount = styled.span`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    /* line-height: 1.5; */
    text-transform: uppercase;
    white-space: nowrap;
`;

const FiatAmount = styled.span`
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.57;
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

const TargetWrapper = styled(motion.div)`
    display: flex;
    flex: 1;
    justify-content: space-between;

    & + & {
        margin-top: 20px;
    }
`;

const TargetAmountsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
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

const StyledHiddenPlaceholder = styled(HiddenPlaceholder)`
    /* padding: 8px 0px; row padding */
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

const TargetAddress = styled(motion.div)`
    display: flex;
    flex: 1;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-variant-numeric: tabular-nums slashed-zero;
`;

const ExpandButton = styled(Button)`
    justify-content: start;
    align-self: flex-start;
`;

const DEFAULT_LIMIT = 3;

const ANIMATION = {
    variants: {
        initial: {
            overflow: 'hidden',
            height: 0,
        },
        visible: {
            height: 'auto',
        },
    },
    initial: 'initial',
    animate: 'visible',
    exit: 'initial',
    transition: { duration: 0.24, ease: 'easeInOut' },
};

const getTxDescription = (tx: WalletAccountTransaction, isUnknown: boolean, isPending: boolean) => {
    // TODO: intl once the structure and all combinations are decided
    const symbol = tx.symbol.toUpperCase();
    if (isUnknown) {
        return <Translation id="TR_UNKNOWN_TRANSACTION" />;
    }
    if (tx.type === 'sent') {
        return isPending ? `Sending ${symbol}` : `Sent ${symbol}`;
    }
    if (tx.type === 'recv') {
        return isPending ? `Receiving ${symbol}` : `Received ${symbol}`;
    }
    if (tx.type === 'self') {
        return isPending ? `Sending ${symbol} to myself` : `Sent ${symbol} to myself`;
    }
    return `Unknown ${symbol} transaction`;
};

export default React.memo((props: Props) => {
    const { transaction } = props;
    const { symbol, type, blockTime, blockHeight, targets, tokens } = transaction;
    const [limit, setLimit] = useState(0);
    const isTokenTransaction = tokens.length > 0;
    const isExpandable = isTokenTransaction
        ? tokens.length - DEFAULT_LIMIT > 0
        : targets.length - DEFAULT_LIMIT > 0;
    const toExpand = isTokenTransaction
        ? tokens.length - DEFAULT_LIMIT - limit
        : targets.length - DEFAULT_LIMIT - limit;
    const useFiatValues = !isTestnet(symbol);
    // blockbook cannot parse some txs
    // eg. tx with eth smart contract that creates a new token has no valid target
    const isUnknown =
        (!isTokenTransaction && !targets.find(t => t.addresses)) || type === 'unknown';
    const operation =
        (type === 'sent' || type === 'self' ? 'neg' : null) || (type === 'recv' ? 'pos' : null);
    let key = 0;

    const buildTargetRow = (
        target: ArrayElement<Props['transaction']['targets']>,
        useAnimation = false,
    ) => {
        const isLocalTarget = (type === 'sent' || type === 'self') && target.isAccountTarget;
        const addr = isLocalTarget ? (
            <Translation id="TR_SENT_TO_SELF" />
        ) : (
            target.addresses?.map((a, i) =>
                type === 'sent' ? (
                    <AddressLabeling key={`${key}${i}`} address={a} />
                ) : (
                    <span>{a}</span>
                ),
            )
        );

        const hasAmount =
            !isLocalTarget && typeof target.amount === 'string' && target.amount !== '0';
        const targetAmount =
            (hasAmount ? target.amount : null) ||
            (target === targets[0] &&
            typeof transaction.amount === 'string' &&
            transaction.amount !== '0'
                ? transaction.amount
                : null);
        const animation = useAnimation ? ANIMATION : {};
        key++;

        return (
            <TargetWrapper key={key} {...animation}>
                <TargetAddress>
                    <StyledHiddenPlaceholder>{addr}</StyledHiddenPlaceholder>
                </TargetAddress>
                <TargetAmountsWrapper>
                    <CryptoAmount>
                        {targetAmount && (
                            <StyledHiddenPlaceholder>
                                {operation && <Sign value={operation} />}
                                {targetAmount} {symbol}
                            </StyledHiddenPlaceholder>
                        )}
                    </CryptoAmount>
                    <FiatAmount>
                        {useFiatValues && targetAmount && (
                            <FiatValue
                                amount={targetAmount}
                                symbol={symbol}
                                source={transaction.rates}
                                useCustomSource
                            />
                        )}
                    </FiatAmount>
                </TargetAmountsWrapper>
            </TargetWrapper>
        );
    };

    const buildTokenRow = (
        transfer: ArrayElement<Props['transaction']['tokens']>,
        useAnimation = false,
    ) => {
        let addr: JSX.Element | string | typeof undefined = transfer.to;
        if (type === 'self') addr = <Translation id="TR_SENT_TO_SELF" />;
        if (type === 'sent') addr = <AddressLabeling address={transfer.to} />;
        const animation = useAnimation ? ANIMATION : {};
        key++;
        return (
            <TargetWrapper key={key} {...animation}>
                <TargetAddress>
                    <StyledHiddenPlaceholder>{addr}</StyledHiddenPlaceholder>
                </TargetAddress>
                <TargetAmountsWrapper>
                    <CryptoAmount>
                        <StyledHiddenPlaceholder>
                            {operation && <Sign value={operation} />}
                            {transfer.amount} {transfer.symbol}
                        </StyledHiddenPlaceholder>
                    </CryptoAmount>
                </TargetAmountsWrapper>
            </TargetWrapper>
        );
    };

    return (
        <Wrapper>
            <TxTypeIconWrapper>
                <TransactionTypeIcon type={transaction.type} isPending={props.isPending} />
            </TxTypeIconWrapper>

            <Content>
                <Description>
                    {getTxDescription(transaction, isUnknown, props.isPending)}
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
                                {targets.slice(0, DEFAULT_LIMIT).map(t => buildTargetRow(t))}
                                <AnimatePresence initial={false}>
                                    {limit > 0 &&
                                        targets
                                            .slice(DEFAULT_LIMIT, DEFAULT_LIMIT + limit)
                                            .map(t => buildTargetRow(t, true))}
                                </AnimatePresence>
                            </>
                        )}

                        {!isUnknown && isTokenTransaction && (
                            <>
                                {tokens.slice(0, DEFAULT_LIMIT).map(t => buildTokenRow(t))}
                                <AnimatePresence initial={false}>
                                    {limit > 0 &&
                                        tokens
                                            .slice(DEFAULT_LIMIT, DEFAULT_LIMIT + limit)
                                            .map(t => buildTokenRow(t, true))}
                                </AnimatePresence>
                            </>
                        )}

                        {!isUnknown &&
                            isTokenTransaction &&
                            type !== 'recv' &&
                            transaction.fee !== '0' && (
                                <TargetWrapper>
                                    <TargetAddress>
                                        <Translation id="TR_FEE" />
                                    </TargetAddress>
                                    <TargetAmountsWrapper>
                                        <CryptoAmount>
                                            <StyledHiddenPlaceholder>
                                                <Sign value="neg" />
                                                {transaction.fee} {symbol}
                                            </StyledHiddenPlaceholder>
                                        </CryptoAmount>
                                        <FiatAmount>
                                            {useFiatValues && (
                                                <FiatValue
                                                    amount={transaction.fee}
                                                    symbol={symbol}
                                                    source={transaction.rates}
                                                    useCustomSource
                                                />
                                            )}
                                        </FiatAmount>
                                    </TargetAmountsWrapper>
                                </TargetWrapper>
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
