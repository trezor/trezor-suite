import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { Icon, colors, variables, Link, Loader, Tooltip, Button } from '@trezor/components';
import { Translation, HiddenPlaceholder } from '@suite-components';
import Box from '../Box';
import BoxRow from '../BoxRow';
import { getDateWithTimeZone } from '@suite-utils/date';
import { WalletAccountTransaction } from '@wallet-types';
import FormattedCryptoAmount from '@suite/components/suite/FormattedCryptoAmount';

const COLOR_TEXT_PRIMARY = colors.BLACK0;

const ExplorerLinkWrapper = styled.div`
    display: flex;
    align-items: center;
    // justify-content: space-between;
    // width: 100%; /* makes text overflow elipsis work */
    display: inline-grid;
    justify-content: flex-end;
    j
`;

const TransactionId = styled(props => <HiddenPlaceholder {...props} />)`
    text-overflow: ellipsis;
    overflow: hidden;
    font-variant-numeric: slashed-zero tabular-nums;
`;

const ExplorerLink = styled(Link)`
    color: ${colors.BLACK25};
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
    width: 100%; /* makes text overflow elipsis work */
`;

const LinkIcon = styled(Icon)`
    margin-left: 10px;
`;

const Confirmations = styled.div`
    display: flex;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const StatusWrapper = styled.div`
    display: flex;
    align-items: baseline;
`;

const ConfirmationsIconWrapper = styled.div`
    display: flex;
    align-items: center;
    margin-right: 0.5ch;
`;

const LoaderIconWrapper = styled.div`
    align-self: center;
    margin-left: 1ch;
`;

const Header = styled.div``;

const HeaderFirstRow = styled.div`
    display: grid;
    grid-gap: 20px;
    grid-template-columns: 1fr 4fr 5fr;
    align-items: center;
    padding-bottom: 28px;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const HeaderSecondRow = styled.div`
    display: grid;
    grid-gap: 20px;
    grid-template-columns: 1fr 5fr;
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 28px 6px 10px 6px;
    text-align: left;
`;

const SecondRowTitle = styled.div`
    text-align: left;
    color: ${colors.BLACK50};
`;

const IconWrapper = styled.div`
    background-color: white;
    border-radius: 100px;
    width: 54px;
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: center;

    & > svg {
        margin: 0 auto;
        display: block;
    }
`;

const TxStatus = styled.div`
    text-align: left;
`;

const TxSentStatus = styled.div`
    color: ${colors.BLACK25};
    font-size: ${variables.NEUE_FONT_SIZE.H2};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.6;
    margin-bottom: 4px;
`;

const ConfirmationStatus = styled.div`
    color: ${colors.NEUE_TYPE_GREEN};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
`;

const Circle = styled.div`
    margin-left: 5px;
    margin-right: 5px;
    color: ${colors.BLACK50};
`;

interface Props {
    tx: WalletAccountTransaction;
    isFetching: boolean;
    confirmations: number;
    totalInput?: string;
    totalOutput?: string;
    explorerUrl?: string;
}

const getHumanReadableTxType = (tx: WalletAccountTransaction) => {
    switch (tx.type) {
        case 'sent':
            return <Translation id="TR_SENT" />;
        case 'recv':
            return <Translation id="TR_RECEIVED" />;
        case 'self':
            return <Translation id="TR_SENT_TO_SELF" />;
        case 'unknown':
            return <Translation id="TR_UNKNOWN" />;
        default:
            return <Translation id="TR_UNKNOWN" />;
    }
};

const BasicDetails = ({
    tx,
    confirmations,
    isFetching,
    explorerUrl,
    totalInput,
    totalOutput,
}: Props) => {
    const isConfirmed = confirmations > 0;
    const transactionStatus = getHumanReadableTxType(tx);
    const assetSymbol = tx.symbol.toUpperCase();
    return (
        <>
            <Header>
                <HeaderFirstRow>
                    <IconWrapper>
                        <Icon size={24} color={colors.BLACK50} icon="SEND" />
                    </IconWrapper>
                    <TxStatus>
                        <TxSentStatus>
                            {transactionStatus} {assetSymbol}
                        </TxSentStatus>

                        {isConfirmed ? (
                            <StatusWrapper>
                                {isFetching && (
                                    <LoaderIconWrapper>
                                        <Loader size={16} />
                                    </LoaderIconWrapper>
                                )}
                                <ConfirmationStatus>
                                    <Translation id="TR_CONFIRMED_TX" />
                                </ConfirmationStatus>
                                <Circle>&bull;</Circle>

                                {confirmations && (
                                    <Confirmations>
                                        <Translation
                                            id="TR_TX_CONFIRMATIONS"
                                            values={{ confirmationsCount: confirmations }}
                                        />
                                        <ConfirmationsIconWrapper>
                                            <Tooltip
                                                placement="top"
                                                content={
                                                    <Translation id="TX_CONFIRMATIONS_EXPLAIN" />
                                                }
                                            >
                                                <Icon
                                                    icon="QUESTION"
                                                    color={colors.BLACK50}
                                                    hoverColor={colors.BLACK25}
                                                    size={14}
                                                />
                                            </Tooltip>
                                        </ConfirmationsIconWrapper>
                                    </Confirmations>
                                )}
                            </StatusWrapper>
                        ) : (
                            <Translation id="TR_UNCONFIRMED_TX" />
                        )}
                    </TxStatus>
                    {explorerUrl ? (
                        <ExplorerLinkWrapper>
                            <ExplorerLink variant="nostyle" href={explorerUrl}>
                                <Translation id="TR_SHOW_DETAILS_IN_BLOCK_EXPLORER" />
                                <LinkIcon icon="EXTERNAL_LINK" size={14} color={colors.BLACK25} />
                            </ExplorerLink>
                        </ExplorerLinkWrapper>
                    ) : (
                        <></>
                    )}
                </HeaderFirstRow>
                <HeaderSecondRow>
                    {/* MINED TIME */}
                    <SecondRowTitle>
                        {isConfirmed ? (
                            <Translation id="TR_MINED_TIME" />
                        ) : (
                            <Translation id="TR_FIRST_SEEN" />
                        )}
                    </SecondRowTitle>

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
                        <Translation id="TR_UNKNOWN_CONFIRMATION_TIME" />
                    )}
                    <SecondRowTitle>
                        <Translation id="TR_TRANSACTION_ID" />
                    </SecondRowTitle>
                    <TransactionId>{tx.txid}</TransactionId>
                </HeaderSecondRow>
            </Header>
        </>
    );
};

export default BasicDetails;
