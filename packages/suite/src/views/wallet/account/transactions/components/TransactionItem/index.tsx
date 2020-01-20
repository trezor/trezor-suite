import React, { useState } from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { Translation } from '@suite-components/Translation';
import { Link, variables, colors, Button } from '@trezor/components-v2';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { ArrayElement } from '@suite/types/utils';
import messages from '@suite/support/messages';
import { getDateWithTimeZone } from '@suite-utils/date';

const Wrapper = styled.div`
    display: flex;
    background: ${colors.WHITE};
    padding: 12px 16px;
    flex-direction: column;

    & + & {
        border-top: 2px solid ${colors.BLACK96};
    }
`;

const Timestamp = styled.div`
    color: ${colors.BLACK50};
    width: 70px;
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

const Col = styled.div`
    display: flex;
    flex-direction: column;
`;
const ColBalance = styled(Col)`
    text-align: end;
`;

const Targets = styled.div`
    color: ${colors.BLACK0};
    font-size: ${variables.FONT_SIZE.TINY};
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

const Balances = styled.div`
    display: flex;
    flex-direction: row;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.BLACK0};
    margin-left: 1rem;
`;

const Symbol = styled.div`
    color: ${colors.BLACK0};
`;

const Amount = styled.div<{ txType: string }>`
    display: flex;
    text-align: right;
    /* color: ${props => (props.txType === 'recv' ? 'green' : 'red')}; */
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

const ExpandableTargets = ({ targets }: { targets: WalletAccountTransaction['targets'] }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const targetLists = targets.map((target, i) => (
        // It is ok to ignore eslint. the list is never reordered/filtered, items have no ids, list/items do not change
        // eslint-disable-next-line react/no-array-index-key
        <Target key={i}>
            {target.addresses && target.addresses.map(addr => <Addr key={addr}>{addr}</Addr>)}
        </Target>
    ));

    if (targets.length > 1 || isExpanded) {
        return (
            <>
                <Button
                    variant="tertiary"
                    size="small"
                    icon={isExpanded ? 'ARROW_UP' : 'ARROW_DOWN'}
                    onClick={() => {
                        setIsExpanded(!isExpanded);
                    }}
                >
                    {targets.length} addressess
                </Button>

                {isExpanded && targetLists}
            </>
        );
    }
    return <>{targetLists}</>;
};

const TransactionItem = React.memo(
    ({ explorerUrl, symbol, type, blockTime, blockHeight, amount, targets, tokens }: Props) => {
        // blockbook cannot parse some txs
        // eg. tx with eth smart contract that creates a new token has no valid target
        const isUnknown = type === 'sent' && targets.length === 1 && targets[0].addresses === null;
        return (
            <Wrapper>
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
                        {targets && <ExpandableTargets targets={targets} />}
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
