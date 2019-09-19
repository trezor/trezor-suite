import React from 'react';
import styled from 'styled-components';
import { AccountTransaction } from 'trezor-connect';
import { FormattedDate } from 'react-intl';
import { Icon, colors, variables } from '@trezor/components';
import Link from '@suite/components/suite/Link';

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

const BlockHash = styled.div`
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

const ArrowWrapper = styled.div`
    display: flex;
`;

const Balances = styled.div<{ addrType: string }>`
    display: flex;
    flex-direction: column;
    color: ${props => (props.addrType === 'sent' ? 'red' : 'green')};
`;

const Addr = styled.div`
    color: ${colors.TEXT_PRIMARY};
    font-family: ${variables.FONT_FAMILY.MONOSPACE};
    font-size: ${variables.FONT_SIZE.SMALL};
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 10px;
`;
const Fee = styled.div`
    color: ${colors.TEXT_SECONDARY};
`;

const Red = styled.span`
    color: red;
`;

interface Props extends AccountTransaction {}

const satoshiToBtc = (amount: number) => {
    return amount / 100000000;
};

// const groupByTimePeriod = (obj: any[], timestampField: string, period: string) => {
//     const objPeriod = {};
//     const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
//     for (let i = 0; i < obj.length; i++) {
//         let d = new Date(obj[i][timestamp] * 1000);
//         if (period == 'day') {
//             d = Math.floor(d.getTime() / oneDay);
//         } else if (period == 'week') {
//             d = Math.floor(d.getTime() / (oneDay * 7));
//         } else if (period == 'month') {
//             d = (d.getFullYear() - 1970) * 12 + d.getMonth();
//         } else if (period == 'year') {
//             d = d.getFullYear();
//         } else {
//             console.log('groupByTimePeriod: You have to set a period! day | week | month | year');
//         }
//         // define object key
//         objPeriod[d] = objPeriod[d] || [];
//         objPeriod[d].push(obj[i]);
//     }
//     return objPeriod;
// };

const TransactionItem = React.memo(
    ({ type, txid, blockTime, blockHash, amount, fee, targets, tokens, accountId }: Props) => {
        return (
            <Wrapper>
                <Heading>
                    <Timestamp>
                        <FormattedDate
                            value={new Date(blockTime * 1000)}
                            day="numeric"
                            month="long"
                            year="numeric"
                            hour="numeric"
                            minute="numeric"
                        />
                    </Timestamp>
                    <BlockHash>
                        <Link isGray href={`https://www.blockchain.com/btc/tx/${txid}`}>
                            {txid}
                        </Link>
                    </BlockHash>
                </Heading>
                <Row>
                    <Targets>
                        {type === 'self' && (
                            <Target>
                                <Addr>(sent to self)</Addr>
                            </Target>
                        )}
                        {targets &&
                            targets.map(target => (
                                <Target>
                                    {target.addresses &&
                                        target.addresses.map(addr => (
                                            <Addr key={addr}>{addr}</Addr>
                                        ))}
                                </Target>
                            ))}
                    </Targets>
                    <Col>
                        {/* <Fee>
                            <Red>-{satoshiToBtc(fee)}</Red>
                        </Fee> */}
                        <Balances addrType={type}>
                            {type === 'recv' && '+'}
                            {type === 'sent' && '-'}
                            {satoshiToBtc(amount)}
                        </Balances>
                    </Col>
                </Row>
            </Wrapper>
        );
    },
);

export default TransactionItem;
