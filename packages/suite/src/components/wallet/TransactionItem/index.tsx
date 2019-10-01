import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { colors, variables } from '@trezor/components';
import { WalletAccountTransaction } from '@suite/reducers/wallet/transactionReducer';
import TokenIcon from '@wallet-views/account/summary/components/Tokens/components/TokenIcon';

const Wrapper = styled.div`
    display: flex;
    border-bottom: 1px solid ${colors.INPUT_BORDER};
    /* background: #fafafa; */
    padding: 8px 0px;
    flex-direction: column;
    line-height: 1.5;
    /* & + & {
        margin-top: 16px;
    } */
`;

const Timestamp = styled.div`
    color: ${colors.TEXT_SECONDARY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    flex: 1;
`;

const TxHash = styled.div`
    /* font-family: ${variables.FONT_FAMILY.MONOSPACE}; */
    color: ${colors.TEXT_SECONDARY};
    font-size: ${variables.FONT_SIZE.SMALL};
    flex: 1 1 0;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Row = styled.div`
    display: flex;
    flex: 1;
    justify-content: space-between;
`;

const AmountWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
`;
const ColBalance = styled(Col)`
    text-align: end;
`;

const Heading = styled(Row)`
    justify-content: space-between;
    padding: 0px 0px;
`;

const Targets = styled.div`
    color: ${colors.TEXT_PRIMARY};
    overflow: hidden;
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
`;

const Symbol = styled.div`
    color: ${colors.TEXT_SECONDARY};
`;

const Amount = styled.div<{ txType: string }>`
    display: flex;
    text-align: right;
    color: ${props => (props.txType === 'sent' ? 'red' : 'green')};
`;

const Addr = styled.div`
    color: ${colors.TEXT_PRIMARY};
    font-family: ${variables.FONT_FAMILY.MONOSPACE};
    font-size: ${variables.FONT_SIZE.SMALL};
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 10px;
`;

const StyledTokenIcon = styled(TokenIcon)`
    align-self: center;
`;

// const Fee = styled.div`
//     color: ${colors.TEXT_SECONDARY};
// `;

// const Red = styled.span`
//     color: red;
// `;

const TransactionItem = React.memo(
    ({
        symbol,
        type,
        txid,
        blockTime,
        blockHeight,
        amount,
        targets,
        tokens,
    }: WalletAccountTransaction) => {
        return (
            <Wrapper>
                <Heading>
                    <Timestamp>
                        {blockTime && (
                            <FormattedDate
                                value={new Date(blockTime * 1000)}
                                day="numeric"
                                month="long"
                                year="numeric"
                                hour="numeric"
                                minute="numeric"
                            />
                        )}
                    </Timestamp>
                    <TxHash>{txid}</TxHash>
                </Heading>
                <Row>
                    <Targets>
                        {type === 'self' && (
                            <Target>
                                <Addr>(sent to self)</Addr>
                            </Target>
                        )}
                        {!blockHeight && <Target>(pending)</Target>}
                        {targets &&
                            targets.map((target, i) => (
                                // It   is ok to ignore eslint. the list is never reordered/filtered, items have no ids, list/items do not change
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
                                        <StyledTokenIcon
                                            address={token.address}
                                            symbol={token.symbol}
                                        />
                                        <Col>
                                            <TokenName>
                                                {token.name} ({token.symbol})
                                            </TokenName>
                                            <Label>
                                                From:&nbsp;<TokenAddress>{token.from}</TokenAddress>
                                            </Label>
                                            <Label>
                                                To:&nbsp;<TokenAddress>{token.to}</TokenAddress>
                                            </Label>
                                        </Col>
                                    </Row>
                                    <AmountWrapper>
                                        <Amount txType={type}>
                                            {token.amount} {token.symbol}
                                        </Amount>
                                    </AmountWrapper>
                                </Token>
                            ))}
                    </Targets>

                    <ColBalance>
                        {/* <Fee>
                            <Red>-{fee}</Red>
                        </Fee> */}
                        <Balances>
                            {amount !== '0' && (
                                <>
                                    <Amount txType={type}>
                                        {type === 'recv' && '+'}
                                        {type === 'sent' && '-'}
                                        {amount}&nbsp;
                                    </Amount>
                                    <Symbol>{symbol.toUpperCase()}</Symbol>
                                </>
                            )}
                        </Balances>
                    </ColBalance>
                </Row>
            </Wrapper>
        );
    },
);

export default TransactionItem;
