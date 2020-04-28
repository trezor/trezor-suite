import React, { useState } from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import {
    Translation,
    HiddenPlaceholder,
    FiatValue,
    Badge,
    AddressLabeling,
} from '@suite-components';
import { variables, colors, Button } from '@trezor/components';
import { isTestnet } from '@wallet-utils/accountUtils';
import { ArrayElement } from '@suite/types/utils';

import { getDateWithTimeZone } from '@suite-utils/date';
import TransactionTypeIcon from './components/TransactionTypeIcon';
import { Props } from './Container';

const Wrapper = styled.div<{ isExpanded: boolean }>`
    display: flex;
    background: ${colors.WHITE};
    padding: 12px 0;
    flex-direction: column;
    cursor: pointer;
`;

const Timestamp = styled.div`
    color: ${colors.BLACK50};
    width: 70px;
    min-width: 70px;
    text-decoration: none;
    font-size: ${variables.FONT_SIZE.TINY};

    &:hover {
        opacity: 1;
    }
`;

const Row = styled.div`
    display: flex;
    flex: 1;
    justify-content: space-between;
    align-items: center;
`;

const ExpandedList = styled.div`
    display: flex;
    flex-direction: column;
    transform-origin: top;
    overflow: hidden;
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
`;

const Targets = styled.div`
    display: flex;
    color: ${colors.BLACK0};
    font-size: ${variables.FONT_SIZE.TINY};
    overflow: hidden;
    align-items: center;
    flex: 1;
`;

const Target = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;

    & + & {
        margin-top: 12px;
    }
`;

const Token = styled.div`
    display: flex;
    flex-direction: column;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const TokenAddress = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
    color: ${colors.BLACK0};
`;

const Label = styled.div`
    display: flex;

    & + & {
        margin-top: 8px;
    }
`;

const Balance = styled.div<{ partial?: boolean; secondary?: boolean }>`
    display: flex;
    flex-direction: row;
    margin-top: ${props => (props.secondary ? '8px' : '0px')};
    font-size: ${props => (props.secondary ? variables.FONT_SIZE.TINY : variables.FONT_SIZE.SMALL)};
    color: ${props => (props.partial || props.secondary ? colors.BLACK50 : colors.BLACK0)};
    margin-left: 1rem;
`;

const FiatBalanceCol = styled(Balance)`
    min-width: 100px;
    justify-content: flex-end;
    text-align: right;
`;

const Symbol = styled.div``;

const Amount = styled.div`
    display: flex;
    text-align: right;
`;

const Addr = styled.div`
    color: ${colors.BLACK0};
    /* font-family: ${variables.FONT_FAMILY.MONOSPACE}; */
    font-size: ${variables.FONT_SIZE.TINY};
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 10px;
`;

const ExpandButton = styled(Button)`
    && {
        color: ${colors.BLACK0};
        font-weight: ${variables.FONT_WEIGHT.REGULAR};
    }
`;

const ExpandedWrapper = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    margin-top: 12px;
    margin-left: 20px;
    overflow: hidden;
`;

const TxIconWrapper = styled.div`
    margin-right: 8px;
    display: flex;
`;

const AmountsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
`;

const TokenTransfer = (transfer: ArrayElement<Props['transaction']['tokens']>) => {
    return (
        <Token>
            <Row>
                <Col>
                    <Label>
                        from:&nbsp;
                        <HiddenPlaceholder>
                            <TokenAddress>
                                <AddressLabeling address={transfer.from} />
                            </TokenAddress>
                        </HiddenPlaceholder>
                    </Label>
                    <Label>
                        to:&nbsp;
                        <HiddenPlaceholder>
                            <TokenAddress>
                                <AddressLabeling address={transfer.to} />
                            </TokenAddress>
                        </HiddenPlaceholder>
                    </Label>
                </Col>
            </Row>
        </Token>
    );
};

// TODO: refactor
const TransactionItem = (props: Props) => {
    const { transaction, ...rest } = props;
    const { symbol, type, blockTime, blockHeight, amount, targets, tokens } = props.transaction;
    const [isExpanded, setIsExpanded] = useState(false);

    const targetsList = targets.map((target, i) => (
        // It is ok to ignore eslint. the list is never reordered/filtered, items have no ids, list/items do not change
        // eslint-disable-next-line react/no-array-index-key
        <Target key={i}>
            {target.addresses &&
                target.addresses.map(addr => (
                    <HiddenPlaceholder key={addr}>
                        <Addr>
                            <AddressLabeling address={addr} />
                        </Addr>
                    </HiddenPlaceholder>
                ))}
        </Target>
    ));

    // blockbook cannot parse some txs
    // eg. tx with eth smart contract that creates a new token has no valid target
    const isUnknown =
        (type === 'sent' && targets.length === 1 && targets[0].addresses === null) ||
        type === 'unknown';
    return (
        <Wrapper
            isExpanded={isExpanded}
            onClick={() => {
                props.openModal({
                    type: 'transaction-detail',
                    tx: props.transaction,
                });
            }}
            className={props.className}
            {...rest}
        >
            <Row>
                <Timestamp>
                    {blockHeight !== 0 && blockTime && blockTime > 0 && (
                        <FormattedDate
                            value={getDateWithTimeZone(blockTime * 1000) ?? undefined}
                            hour="numeric"
                            minute="numeric"
                        />
                    )}
                </Timestamp>
                <Targets>
                    {type === 'self' && (
                        <Target>
                            <Addr>
                                <Translation id="TR_SENT_TO_SELF" />
                            </Addr>
                        </Target>
                    )}
                    {isUnknown && (
                        <Target>
                            <Addr>
                                <Translation id="TR_UNKNOWN_TRANSACTION" />
                            </Addr>
                        </Target>
                    )}

                    {targets && targets.length === 1 && (
                        <>
                            <TxIconWrapper>
                                <TransactionTypeIcon type={type} />
                            </TxIconWrapper>
                            {targetsList}
                        </>
                    )}
                    {targets && targets.length > 1 && (
                        <>
                            <TxIconWrapper>
                                <TransactionTypeIcon type={type} />
                            </TxIconWrapper>
                            <ExpandButton
                                variant="tertiary"
                                size="small"
                                icon={isExpanded ? 'ARROW_UP' : 'ARROW_DOWN'}
                                onClick={e => {
                                    setIsExpanded(!isExpanded);
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <Translation
                                    id="TR_N_ADDRESSES"
                                    values={{ count: targets.length }}
                                />
                            </ExpandButton>
                        </>
                    )}

                    {tokens &&
                        tokens.map(token => <TokenTransfer key={token.address} {...token} />)}
                </Targets>
                <AmountsWrapper>
                    {tokens.map(t => (
                        <HiddenPlaceholder key={t.symbol}>
                            <Balance>
                                <Amount>
                                    {t.type === 'recv' && '+'}
                                    {t.type !== 'recv' && '-'}
                                    {t.amount}&nbsp;
                                </Amount>
                                <Symbol>{t.symbol.toUpperCase()}</Symbol>
                            </Balance>
                        </HiddenPlaceholder>
                    ))}
                    {amount !== '0' && (
                        <HiddenPlaceholder>
                            <Balance secondary={tokens.length > 0}>
                                <Amount>
                                    {type === 'recv' && '+'}
                                    {type !== 'recv' && '-'}
                                    {amount}&nbsp;
                                </Amount>
                                <Symbol>{symbol.toUpperCase()}</Symbol>
                            </Balance>
                        </HiddenPlaceholder>
                    )}
                </AmountsWrapper>
                <AmountsWrapper>
                    {!isTestnet(symbol) &&
                        tokens.map(_t => (
                            <HiddenPlaceholder key={symbol}>
                                <FiatBalanceCol>
                                    {/* we dont fetch historical rates for tokens */}
                                    {/* <FiatValue amount={t.amount} symbol={t.symbol}>
                                    {({ value }) =>
                                        value ? <SmallBadge>{value}</SmallBadge> : null
                                    }
                                </FiatValue> */}
                                </FiatBalanceCol>
                            </HiddenPlaceholder>
                        ))}
                    {amount !== '0' && !isTestnet(symbol) && (
                        <HiddenPlaceholder>
                            <FiatBalanceCol>
                                <FiatValue
                                    amount={amount}
                                    symbol={symbol}
                                    source={props.transaction.rates}
                                    useCustomSource
                                >
                                    {({ value }) => value && <Badge isSmall>{value}</Badge>}
                                </FiatValue>
                            </FiatBalanceCol>
                        </HiddenPlaceholder>
                    )}
                </AmountsWrapper>
            </Row>
            {isExpanded && (
                <ExpandedList>
                    {targets.map((target, i) => {
                        return (
                            // eslint-disable-next-line react/no-array-index-key
                            <Row key={i}>
                                <Timestamp />
                                <ExpandedWrapper>
                                    <Targets>
                                        <HiddenPlaceholder>
                                            <Target>
                                                {target.addresses &&
                                                    target.addresses.map(addr => (
                                                        <Addr key={addr}>
                                                            <AddressLabeling address={addr} />
                                                        </Addr>
                                                    ))}
                                            </Target>
                                        </HiddenPlaceholder>
                                    </Targets>
                                    <Balance partial>
                                        <Amount>
                                            {type === 'recv' && '+'}
                                            {type !== 'recv' && '-'}
                                            {target.amount}&nbsp;
                                        </Amount>
                                        <Symbol>{symbol.toUpperCase()}</Symbol>
                                    </Balance>
                                    <FiatValue
                                        amount={target.amount || '0'}
                                        symbol={symbol}
                                        source={props.transaction.rates}
                                        useCustomSource
                                    >
                                        {({ value }) =>
                                            value && (
                                                <FiatBalanceCol partial>
                                                    <Badge isSmall>{value}</Badge>
                                                </FiatBalanceCol>
                                            )
                                        }
                                    </FiatValue>
                                </ExpandedWrapper>
                            </Row>
                        );
                    })}
                </ExpandedList>
            )}
        </Wrapper>
    );
};

export default TransactionItem;
