import React, { useState } from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Translation,
    HiddenPlaceholder,
    FiatValue,
    Badge,
    AddressLabeling,
} from '@suite-components';
import { variables, colors, Button, Link } from '@trezor/components';
import { isTestnet } from '@wallet-utils/accountUtils';
import { ArrayElement } from '@suite/types/utils';

import { getDateWithTimeZone } from '@suite-utils/date';
import TransactionTypeIcon from './components/TransactionTypeIcon';
import { Props } from './Container';

const StyledHiddenPlaceholder = styled(HiddenPlaceholder)`
    padding: 8px 0px; /* row padding */
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

const ColDate = styled(Link)`
    grid-column: date;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const ColType = styled.div`
    grid-column: type;
    padding: 0px 12px;
`;

const Addr = styled(motion.div)`
    grid-column: target;
    color: ${colors.BLACK0};
    /* font-family: ${variables.FONT_FAMILY.MONOSPACE}; */
    font-size: ${variables.FONT_SIZE.SMALL};
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-column: target / fiat;
    }
`;

const Balance = styled(motion.div)<{ partial?: boolean; secondary?: boolean }>`
    grid-column: amount;
    font-size: ${props => (props.secondary ? variables.FONT_SIZE.TINY : variables.FONT_SIZE.SMALL)};
    color: ${props => (props.partial || props.secondary ? colors.BLACK50 : colors.BLACK0)};
    white-space: nowrap;
    text-overflow: ellipsis;
    text-transform: uppercase;
    text-align: right;
    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        text-align: left;
    }
`;

const ColFiat = styled(motion.div)`
    grid-column: fiat;
    padding-left: 16px;
    display: flex;
    justify-content: flex-end;
`;

const ExpandButton = styled(Button)`
    padding: 8px 0px;
    grid-column: target;
    justify-content: start;
    && {
        color: ${colors.BLACK0};
        font-weight: ${variables.FONT_WEIGHT.REGULAR};
    }
    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-column: target;
    }
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
        (type === 'sent' || type === 'self' ? '-' : null) || (type === 'recv' ? '+' : null);
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
            <React.Fragment key={key}>
                <Addr {...animation}>
                    <StyledHiddenPlaceholder>{addr}</StyledHiddenPlaceholder>
                </Addr>
                {targetAmount && (
                    <Balance {...animation}>
                        <StyledHiddenPlaceholder>
                            {operation}
                            {targetAmount} {symbol}
                        </StyledHiddenPlaceholder>
                    </Balance>
                )}
                {useFiatValues && targetAmount && (
                    <ColFiat {...animation}>
                        <StyledHiddenPlaceholder>
                            <FiatValue
                                amount={targetAmount}
                                symbol={symbol}
                                source={transaction.rates}
                                useCustomSource
                            >
                                {({ value }) => value && <Badge isSmall>{value}</Badge>}
                            </FiatValue>
                        </StyledHiddenPlaceholder>
                    </ColFiat>
                )}
            </React.Fragment>
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
            <React.Fragment key={key}>
                <Addr {...animation}>
                    <StyledHiddenPlaceholder>{addr}</StyledHiddenPlaceholder>
                </Addr>
                <Balance {...animation}>
                    <StyledHiddenPlaceholder>
                        {operation}
                        {transfer.amount} {transfer.symbol}
                    </StyledHiddenPlaceholder>
                </Balance>
                {/* TODO: token fiat rates missing? */}
                {/* {useFiatValues && (
                    <ColFiat {...animation}>
                        <StyledHiddenPlaceholder>
                            <FiatValue amount={transfer.amount} symbol={transfer.symbol}>
                                {({ value }) => value && <Badge isSmall>{value}</Badge>}
                            </FiatValue>
                        </StyledHiddenPlaceholder>
                    </ColFiat>
                )} */}
            </React.Fragment>
        );
    };

    return (
        <>
            <ColDate
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
                        hour="numeric"
                        minute="numeric"
                    />
                )}
            </ColDate>
            <ColType>
                <TransactionTypeIcon type={transaction.type} />
            </ColType>

            {isUnknown && (
                <Addr>
                    <Translation id="TR_UNKNOWN_TRANSACTION" />
                </Addr>
            )}

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

            {isExpandable && (
                <ExpandButton
                    variant="tertiary"
                    size="small"
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

            {!isUnknown && isTokenTransaction && type !== 'recv' && transaction.fee !== '0' && (
                <>
                    <Addr>
                        <Translation id="TR_FEE" />
                    </Addr>
                    <Balance>
                        <StyledHiddenPlaceholder>
                            -{transaction.fee} {symbol}
                        </StyledHiddenPlaceholder>
                    </Balance>
                    {useFiatValues && (
                        <ColFiat>
                            <StyledHiddenPlaceholder>
                                <FiatValue
                                    amount={transaction.fee}
                                    symbol={symbol}
                                    source={transaction.rates}
                                    useCustomSource
                                >
                                    {({ value }) => value && <Badge isSmall>{value}</Badge>}
                                </FiatValue>
                            </StyledHiddenPlaceholder>
                        </ColFiat>
                    )}
                </>
            )}
        </>
    );
});
