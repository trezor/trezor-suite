import React from 'react';
import styled from 'styled-components';
import { FormattedDate, FormattedMessage } from 'react-intl';
import { Link, colors, variables } from '@trezor/components';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { ArrayElement } from '@suite/types/utils';
import l10nMessages from '../../index.messages';

const Wrapper = styled.div`
    display: flex;
    background: ${colors.WHITE};
    padding: 10px 35px;
    flex-direction: column;
    line-height: 1.5;
    margin: 0 -35px;
`;

const Timestamp = styled(Link)`
    color: ${colors.TEXT_SECONDARY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    width: 70px;
    text-decoration: none;
    font-size: 0.8em;
    opacity: 0.5;
    cursor: pointer;

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

const Col = styled.div`
    display: flex;
    flex-direction: column;
`;
const ColBalance = styled(Col)`
    text-align: end;
`;

const Targets = styled.div`
    color: ${colors.TEXT_PRIMARY};
    overflow: hidden;
    flex: 1;
`;

const Target = styled.div`
    display: flex;
    flex-direction: column;
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
    color: ${colors.TEXT_SECONDARY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const TokenAddress = styled.div`
    color: ${colors.TEXT_SECONDARY};
    font-family: ${variables.FONT_FAMILY.MONOSPACE};
    font-size: ${variables.FONT_SIZE.SMALL};
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Label = styled.div`
    color: ${colors.TEXT_SECONDARY};
    font-size: ${variables.FONT_SIZE.SMALL};
    display: flex;
`;

const Balances = styled.div`
    display: flex;
    flex-direction: row;
    color: ${colors.TEXT_PRIMARY};
    margin-left: 1rem;
`;

const Symbol = styled.div`
    color: ${colors.TEXT_SECONDARY};
`;

const Amount = styled.div<{ txType: string }>`
    display: flex;
    text-align: right;
    color: ${props => (props.txType === 'recv' ? 'green' : 'red')};
`;

const TokenAmount = styled(Token)<{ txType: string }>`
    display: inline;
    color: ${props => (props.txType === 'recv' ? 'green' : 'red')};
    border: none;
`;

const Addr = styled.div`
    color: ${colors.TEXT_PRIMARY};
    font-family: ${variables.FONT_FAMILY.MONOSPACE};
    font-size: ${variables.FONT_SIZE.BASE};
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 10px;
`;

type Props = {
    explorerUrl: string;
} & WalletAccountTransaction;

const TokenTransfer = (transfer: ArrayElement<Props['tokens']>) => {
    if (transfer.type === 'self') {
        return (
            <Token>
                <Row>
                    <Col>
                        <TokenName>
                            {transfer.name} ({transfer.symbol})
                        </TokenName>
                        <Label>
                            <FormattedMessage {...l10nMessages.TR_SENT_TO_SELF} />
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

const TransactionItem = React.memo(
    ({ explorerUrl, symbol, type, blockTime, blockHeight, amount, targets, tokens }: Props) => {
        // blockbook cannot parse some txs
        // eg. tx with eth smart contract that creates a new token has no valid target
        const isUnknown = type === 'sent' && targets.length === 1 && targets[0].addresses === null;
        return (
            <Wrapper>
                <Row>
                    <Timestamp href={explorerUrl}>
                        {blockHeight !== 0 && blockTime && blockTime > 0 && (
                            <FormattedDate
                                value={new Date(blockTime * 1000)}
                                hour="numeric"
                                minute="numeric"
                            />
                        )}
                    </Timestamp>
                    <Targets>
                        {type === 'self' && (
                            <Target>
                                <Addr>
                                    <FormattedMessage {...l10nMessages.TR_SENT_TO_SELF} />
                                </Addr>
                            </Target>
                        )}
                        {isUnknown && (
                            <Target>
                                <Addr>
                                    <FormattedMessage {...l10nMessages.TR_UNKNOWN_TRANSACTION} />
                                </Addr>
                            </Target>
                        )}
                        {targets &&
                            targets.map((target, i) => (
                                // It is ok to ignore eslint. the list is never reordered/filtered, items have no ids, list/items do not change
                                // eslint-disable-next-line react/no-array-index-key
                                <Target key={i}>
                                    {target.addresses &&
                                        target.addresses.map(addr => (
                                            <Addr key={addr}>{addr}</Addr>
                                        ))}
                                </Target>
                            ))}
                        {tokens &&
                            tokens.map(token => <TokenTransfer key={token.address} {...token} />)}
                    </Targets>
                    {amount !== '0' && (
                        <ColBalance>
                            <Balances>
                                <Amount txType={type}>
                                    {type === 'recv' && '+'}
                                    {type !== 'recv' && '-'}
                                    {amount}&nbsp;
                                </Amount>
                                <Symbol>{symbol.toUpperCase()}</Symbol>
                            </Balances>
                        </ColBalance>
                    )}
                </Row>
            </Wrapper>
        );
    },
);

export default TransactionItem;
