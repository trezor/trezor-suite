import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { Link, colors, variables } from '@trezor/components';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';

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

const TransactionItem = React.memo(
    ({ explorerUrl, symbol, type, blockTime, blockHeight, amount, targets, tokens }: Props) => {
        return (
            <Wrapper>
                <Row>
                    <Timestamp href={explorerUrl}>
                        {blockTime && (
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
                                <Addr>(sent to self)</Addr>
                            </Target>
                        )}
                        {!blockHeight && <Target>(pending)</Target>}
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
                            tokens.map(token => (
                                <Token>
                                    <Row>
                                        <Col>
                                            <TokenName>
                                                {token.name} ({token.symbol})
                                                <TokenAmount txType={type}>
                                                    {type === 'recv' && '+'}
                                                    {type !== 'recv' && '-'}
                                                    {token.amount} {token.symbol}
                                                </TokenAmount>
                                            </TokenName>
                                            <Label>
                                                From:&nbsp;<TokenAddress>{token.from}</TokenAddress>
                                            </Label>
                                            <Label>
                                                To:&nbsp;<TokenAddress>{token.to}</TokenAddress>
                                            </Label>
                                        </Col>
                                    </Row>
                                </Token>
                            ))}
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
