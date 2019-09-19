import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { colors, variables } from '@trezor/components';
import Link from '@suite/components/suite/Link';
import { WalletAccountTransaction } from '@suite/reducers/wallet/transactionReducer';

const Wrapper = styled.div`
    display: flex;
    border-bottom: 1px solid ${colors.INPUT_BORDER};
    /* background: #fafafa; */
    padding: 8px 16px;
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
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
    text-align: end;
`;

const Heading = styled(Row)`
    justify-content: space-between;
`;

const Targets = styled.div`
    color: ${colors.TEXT_PRIMARY};
    flex: 1;
    overflow: hidden;
`;

const Target = styled.div`
    display: flex;
    flex-direction: column;
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
    flex-direction: column;
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
// const Fee = styled.div`
//     color: ${colors.TEXT_SECONDARY};
// `;

// const Red = styled.span`
//     color: red;
// `;

const TransactionItem = React.memo(
    ({ symbol, type, txid, blockTime, amount, targets }: WalletAccountTransaction) => {
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
                    <TxHash>
                        <Link isGray href={`https://www.blockchain.com/btc/tx/${txid}`}>
                            {txid}
                        </Link>
                    </TxHash>
                </Heading>
                <Row>
                    <Targets>
                        {type === 'self' && (
                            <Target>
                                <Addr>(sent to self)</Addr>
                            </Target>
                        )}
                        {targets &&
                            targets.map((target, i) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <Target key={i}>
                                    {target.addresses &&
                                        target.addresses.map(addr => (
                                            <Addr key={addr}>{addr}</Addr>
                                        ))}
                                </Target>
                            ))}
                    </Targets>
                    <Col>
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
                    </Col>
                </Row>
            </Wrapper>
        );
    },
);

export default TransactionItem;
