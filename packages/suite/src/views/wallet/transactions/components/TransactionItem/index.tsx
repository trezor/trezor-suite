import React, { useState } from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { Translation } from '@suite-components/Translation';
import { variables, colors, Button } from '@trezor/components-v2';
import { ArrayElement } from '@suite/types/utils';
import messages from '@suite/support/messages';
import { getDateWithTimeZone } from '@suite-utils/date';
import TransactionTypeIcon from '../TransactionTypeIcon';
import Badge from '@suite/components/suite/Badge';
import FiatValue from '@suite-components/FiatValue/Container';
import { Props } from './Container';

const Wrapper = styled.div<{ isExpanded: boolean }>`
    display: flex;
    background: ${colors.WHITE};
    padding: 12px 16px;
    flex-direction: column;
    cursor: pointer;

    /* &:hover {
        background: ${colors.BLACK96};
    } */
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
    border: 1px solid #f2f2f2;
    border-radius: 3px;
    padding: 4px 8px;
    background: #fafafa;
`;

const TokenName = styled.div`
    color: ${colors.BLACK0};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const TokenAddress = styled.div`
    color: ${colors.BLACK0};
    /* font-family: ${variables.FONT_FAMILY.MONOSPACE}; */
    font-size: ${variables.FONT_SIZE.SMALL};
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Label = styled.div`
    color: ${colors.BLACK80};
    font-size: ${variables.FONT_SIZE.SMALL};
    display: flex;
`;

const Balance = styled.div<{ partial?: boolean }>`
    display: flex;
    flex-direction: row;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => (props.partial === true ? colors.BLACK50 : colors.BLACK0)};
    margin-left: 1rem;
`;

const FiatBalance = styled(Balance)`
    min-width: 100px;
    justify-content: flex-end;
    text-align: right;
`;

const Symbol = styled.div``;

const Amount = styled.div`
    display: flex;
    text-align: right;
`;

const TokenAmount = styled(Token)<{ txType: string }>`
    display: inline;
    /* color: ${props => (props.txType === 'recv' ? 'green' : 'red')}; */
    border: none;
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

const SmallBadge = styled(Badge)`
    font-size: ${variables.FONT_SIZE.TINY};
`;

const TokenTransfer = (transfer: ArrayElement<Props['transaction']['tokens']>) => {
    if (transfer.type === 'self') {
        return (
            <Token>
                <Row>
                    <Col>
                        <TokenName>
                            {transfer.name} ({transfer.symbol})
                        </TokenName>
                        <Label>
                            <Translation {...messages.TR_SENT_TO_SELF} />
                        </Label>
                    </Col>
                </Row>
            </Token>
        );
    }
    return (
        <Token>
            <Row>
                <Col>
                    <TokenName>
                        {transfer.name} ({transfer.symbol})
                        <TokenAmount txType={transfer.type}>
                            {transfer.type === 'recv' && '+'}
                            {transfer.type !== 'recv' && '-'}
                            {transfer.amount} {transfer.symbol}
                        </TokenAmount>
                    </TokenName>
                    <Label>
                        From:&nbsp;<TokenAddress>{transfer.from}</TokenAddress>
                    </Label>
                    <Label>
                        To:&nbsp;<TokenAddress>{transfer.to}</TokenAddress>
                    </Label>
                </Col>
            </Row>
        </Token>
    );
};

const TransactionItem = React.memo((props: Props) => {
    const { symbol, type, blockTime, blockHeight, amount, targets, tokens } = props.transaction;
    const [isExpanded, setIsExpanded] = useState(false);

    const targetsList = targets.map((target, i) => (
        // It is ok to ignore eslint. the list is never reordered/filtered, items have no ids, list/items do not change
        // eslint-disable-next-line react/no-array-index-key
        <Target key={i}>
            {target.addresses && target.addresses.map(addr => <Addr key={addr}>{addr}</Addr>)}
        </Target>
    ));

    // blockbook cannot parse some txs
    // eg. tx with eth smart contract that creates a new token has no valid target
    const isUnknown = type === 'sent' && targets.length === 1 && targets[0].addresses === null;
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
        >
            <Row>
                <Timestamp>
                    {blockHeight !== 0 && blockTime && blockTime > 0 && (
                        <FormattedDate
                            value={getDateWithTimeZone(blockTime * 1000)}
                            hour="numeric"
                            minute="numeric"
                        />
                    )}
                </Timestamp>
                <Targets>
                    {type === 'self' && (
                        <Target>
                            <Addr>
                                <Translation {...messages.TR_SENT_TO_SELF} />
                            </Addr>
                        </Target>
                    )}
                    {isUnknown && (
                        <Target>
                            <Addr>
                                <Translation {...messages.TR_UNKNOWN_TRANSACTION} />
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
                                {targets.length} addressess
                            </ExpandButton>
                        </>
                    )}

                    {tokens &&
                        tokens.map(token => <TokenTransfer key={token.address} {...token} />)}
                </Targets>
                {amount !== '0' && (
                    <>
                        <Balance>
                            <Amount>
                                {type === 'recv' && '+'}
                                {type !== 'recv' && '-'}
                                {amount}&nbsp;
                            </Amount>
                            <Symbol>{symbol.toUpperCase()}</Symbol>
                        </Balance>
                        <FiatValue amount={amount} symbol={symbol}>
                            {fiatValue =>
                                fiatValue && (
                                    <FiatBalance>
                                        <SmallBadge>{fiatValue}</SmallBadge>
                                    </FiatBalance>
                                )
                            }
                        </FiatValue>
                    </>
                )}
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
                                        <Target>
                                            {target.addresses &&
                                                target.addresses.map(addr => (
                                                    <Addr key={addr}>{addr}</Addr>
                                                ))}
                                        </Target>
                                    </Targets>
                                    <Balance partial>
                                        <Amount>
                                            {type === 'recv' && '+'}
                                            {type !== 'recv' && '-'}
                                            {target.amount}&nbsp;
                                        </Amount>
                                        <Symbol>{symbol.toUpperCase()}</Symbol>
                                    </Balance>
                                    <FiatValue amount={target.amount || '0'} symbol={symbol}>
                                        {fiatValue =>
                                            fiatValue && (
                                                <FiatBalance partial>
                                                    <SmallBadge>{fiatValue}</SmallBadge>
                                                </FiatBalance>
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
});

export default TransactionItem;
