import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled, { css } from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { H2, P, Icon, colors, variables, Link, Button, Modal } from '@trezor/components-v2';
import { Dispatch } from '@suite-types';
import { WalletAccountTransaction } from '@suite/reducers/wallet/transactionReducer';
import { FormattedDate } from 'react-intl';
import { getDateWithTimeZone } from '@suite-utils/date';
import NETWORKS from '@wallet-config/networks';
import BigNumber from 'bignumber.js';
import FiatValue from '@suite-components/FiatValue/Container';
import Badge from '@suite-components/Badge';

const COLOR_BORDER = colors.BLACK96;
const COLOR_TEXT_SECONDARY = colors.BLACK25;
const COLOR_TEXT_PRIMARY = colors.BLACK0;

const Wrapper = styled.div`
    width: 100%;
    max-width: 720px;
    flex-direction: column;
`;

const Title = styled(H2)`
    margin-bottom: 20px;
`;

const Box = styled.div`
    border-radius: 3px;
    border: solid 2px ${COLOR_BORDER};

    & + & {
        margin-top: 20px;
    }
`;

const RowWrapper = styled.div`
    display: flex;
    align-items: center;
    height: 42px;
    padding: 10px 12px;

    & + & {
        border-top: solid 2px ${COLOR_BORDER};
    }
`;

const RowTitle = styled.div`
    display: flex;
    width: 160px;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${COLOR_TEXT_SECONDARY};
`;

const RowContent = styled.div<{ alignContent?: 'left' | 'right' }>`
    display: flex;
    flex: 1;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${COLOR_TEXT_PRIMARY};
    min-width: 0;

    ${props =>
        props.alignContent &&
        css`
            text-align: ${p => (p.alignContent === 'left' ? 'left' : 'right')};
            justify-content: ${p => (p.alignContent === 'left' ? 'flex-start' : 'flex-end')};
        `}
`;

const TransactionIdWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%; /* makes text overflow elipsis work */
`;

const TransactionId = styled.div`
    text-overflow: ellipsis;
    overflow: hidden;
    font-family: ${variables.FONT_FAMILY.MONOSPACE};
    font-weight: lighter;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${COLOR_TEXT_PRIMARY};
`;

const ExplorerLink = styled(Link)`
    width: 100%; /* makes text overflow elipsis work */
`;

const LinkIcon = styled(Icon)`
    margin-left: 10px;
`;

const Grid = styled.div`
    display: grid;
    grid-gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`;

const Col = styled.div<{ direction: 'column' | 'row' }>`
    display: flex;
    flex-direction: ${props => props.direction};
    flex: 1 1 auto;
`;

const Divider = styled.div`
    width: 100%;
    height: 20px;
`;

const BoxHeading = styled.div<{ historical?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0px 12px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => (props.historical ? '#b3b3b3' : colors.BLACK50)};
    margin-bottom: 10px;
`;

const HistoricalBadge = styled(Badge)`
    background: #b3b3b3;
    color: white;
`;

const Buttons = styled.div`
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-top: 40px;
`;

const getHumanReadableTxType = (tx: WalletAccountTransaction) => {
    switch (tx.type) {
        case 'sent':
            return 'Incoming';
        case 'recv':
            return 'Outgoing';
        case 'self':
            return 'Sent to self';
        case 'unknown':
            return 'Unknown';
        default:
            return 'Unknown';
    }
};

interface RowProps {
    title: React.ReactNode;
    alignContent?: 'right' | 'left';
    children?: React.ReactNode;
}

const Row = ({ title, alignContent, children }: RowProps) => {
    return (
        <RowWrapper>
            <RowTitle>{title}</RowTitle>
            <RowContent alignContent={alignContent}>{children}</RowContent>
        </RowWrapper>
    );
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
    // onScan: bindActionCreators(sendFormActions.onQrScan, dispatch),
});

type Props = {
    tx: WalletAccountTransaction;
    onCancel: () => void;
} & ReturnType<typeof mapDispatchToProps>;

const TransactionDetail = (props: Props) => {
    const { tx } = props;
    const isConfirmed = tx.blockHeight !== 0 && tx.blockTime && tx.blockTime > 0;
    const explorerBaseUrl = NETWORKS.find(n => n.symbol === tx.symbol)?.explorer.tx;
    const explorerUrl = explorerBaseUrl ? `${explorerBaseUrl}${tx.txid}` : null;

    const totalInput = tx.amount;
    const totalOutput = new BigNumber(tx.amount).minus(tx.fee);
    const assetSymbol = tx.symbol.toUpperCase();

    return (
        <Wrapper>
            <Title>Transaction detail</Title>
            <Box>
                <Row title="Status">{isConfirmed ? 'Confirmed' : 'Unconfirmed'}</Row>
                <Row title="Type">{getHumanReadableTxType(tx)}</Row>
                <Row title={isConfirmed ? 'Mined Time' : 'First Seen'}>
                    {tx.blockTime ? (
                        <FormattedDate
                            value={getDateWithTimeZone(tx.blockTime * 1000)}
                            // value={tx.blockTime * 1000}
                            year="numeric"
                            month="2-digit"
                            day="2-digit"
                            hour="2-digit"
                            minute="2-digit"
                            // timeZone="utc"
                        />
                    ) : (
                        'unknown'
                    )}
                </Row>
                <Row title="Transaction ID">
                    {explorerUrl ? (
                        <ExplorerLink variant="nostyle" href={explorerUrl}>
                            <TransactionIdWrapper>
                                <TransactionId>{tx.txid}</TransactionId>
                                <LinkIcon
                                    icon="EXTERNAL_LINK"
                                    size={14}
                                    color={COLOR_TEXT_PRIMARY}
                                />
                            </TransactionIdWrapper>
                        </ExplorerLink>
                    ) : (
                        <TransactionIdWrapper>
                            <TransactionId>{tx.txid}</TransactionId>
                        </TransactionIdWrapper>
                    )}
                </Row>
            </Box>
            <Box>
                <Row title="Total Input">{`${totalInput} ${assetSymbol}`}</Row>
                <Row title="Total Output">{`${totalOutput} ${assetSymbol}`}</Row>
                <Row title="Fee">{`${tx.fee} ${assetSymbol}`}</Row>
                <Row title="Size">blabla</Row>
            </Box>
            <Divider />
            <Grid>
                <Col direction="column">
                    <BoxHeading>
                        Current Value ()
                        <Badge>
                            <FiatValue amount="1" symbol={tx.symbol} />
                        </Badge>
                    </BoxHeading>
                    <Box>
                        <Row title="Total Output" alignContent="right">
                            <FiatValue amount={totalOutput.toFixed()} symbol={tx.symbol} />
                        </Row>
                        <Row title="Fee" alignContent="right">
                            <FiatValue amount={tx.fee} symbol={tx.symbol} />
                        </Row>
                    </Box>
                </Col>
                <Col direction="column">
                    <BoxHeading historical>
                        Historical Value ()
                        <HistoricalBadge>
                            <FiatValue amount="1" symbol={tx.symbol} />
                        </HistoricalBadge>
                    </BoxHeading>
                    <Box>
                        <Row title="Total Output" alignContent="right">
                            <FiatValue amount={totalOutput.toFixed()} symbol={tx.symbol} />
                        </Row>
                        <Row title="Fee" alignContent="right">
                            2
                        </Row>
                    </Box>
                </Col>
            </Grid>
            <Buttons>
                <Button variant="secondary">Close</Button>
                <Button alignIcon="right" icon="EXTERNAL_LINK" variant="secondary">
                    Show details
                </Button>
            </Buttons>
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(TransactionDetail);
