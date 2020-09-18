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

const Wrapper = styled.div`
    background-color: ${colors.BACKGROUND};
    padding: 18px;
    border-radius: 6px;
`;

const ExplorerLinkWrapper = styled.div`
    display: flex;
    align-items: center;
    display: inline-grid;
    justify-content: flex-end;
`;

const ExplorerLinkTransationWrapper = styled.div`
    display: flex;
    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const TransactionId = styled(props => <HiddenPlaceholder {...props} />)`
    text-overflow: ellipsis;
    overflow: hidden;
    font-variant-numeric: slashed-zero tabular-nums;
`;

const ExplorerLink = styled(Link)`
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
    height: 20px;
    align-items: center;
`;

const ConfirmationsIconWrapper = styled.div`
    display: flex;
    align-items: center;
    margin-right: 0.5ch;
`;

const LoaderIconWrapper = styled.div`
    align-self: left;
    margin-right: 10px;
`;

const HeaderFirstRow = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-template-columns: minmax(45px, 65px) 4fr 160px;
    align-items: center;
    padding-bottom: 28px;
    padding-right: 6px;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
    color: ${colors.BLACK25};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-template-columns: minmax(45px, 55px) 1fr 20px;
    }
`;

const HeaderSecondRow = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-template-columns: minmax(100px, 140px) 1fr;
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 28px 6px 10px 6px;
    text-align: left;
`;

const SecondRowTitle = styled.div`
    text-align: left;
    color: ${colors.BLACK50};
`;

const SecondRowValue = styled.div`
    color: ${colors.BLACK25};
    overflow: hidden;
    text-overflow: ellipsis;
`;

const IconWrapper = styled.div`
    background-color: white;
    border-radius: 100px;

    display: flex;
    align-items: center;
    justify-content: center;
    & > svg {
        margin: 0 auto;
        display: block;
    }
`;

const MainIconWrapper = styled(IconWrapper)`
    width: 54px;
    height: 54px;
    position: relative;
`;

const NestedIconWrapper = styled(IconWrapper)`
    width: 16px;
    height: 16px;
    position: absolute;
    top: 0px;
    right: 0px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
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

const ConfirmationStatus = styled.div<{ confirmed: boolean }>`
    color: ${props => (props.confirmed ? colors.NEUE_TYPE_GREEN : colors.NEUE_TYPE_ORANGE)};
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

const BasicDetails = ({ tx, confirmations, isFetching, explorerUrl }: Props) => {
    const isConfirmed = confirmations > 0;
    const transactionStatus = getHumanReadableTxType(tx);
    const assetSymbol = tx.symbol.toUpperCase();
    return (
        <Wrapper>
            <HeaderFirstRow>
                <MainIconWrapper>
                    <Icon size={24} color={colors.BLACK50} icon="SEND" />
                    <NestedIconWrapper>
                        <Icon
                            size={12}
                            color={isConfirmed ? colors.NEUE_BG_GREEN : colors.NEUE_TYPE_ORANGE}
                            icon={isConfirmed ? 'CHECK' : 'CLOCK'}
                        />
                    </NestedIconWrapper>
                </MainIconWrapper>
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
                            <ConfirmationStatus confirmed>
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
                                            content={<Translation id="TX_CONFIRMATIONS_EXPLAIN" />}
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
                        <ConfirmationStatus confirmed={false}>
                            <Translation id="TR_UNCONFIRMED_TX" />
                        </ConfirmationStatus>
                    )}
                </TxStatus>
                {explorerUrl ? (
                    <ExplorerLinkWrapper>
                        <ExplorerLink variant="nostyle" href={explorerUrl}>
                            <ExplorerLinkTransationWrapper>
                                <Translation id="TR_OPEN_IN_BLOCK_EXPLORER" />
                            </ExplorerLinkTransationWrapper>
                            <LinkIcon icon="EXTERNAL_LINK" size={14} color={colors.BLACK25} />
                        </ExplorerLink>
                    </ExplorerLinkWrapper>
                ) : (
                    <></>
                )}
            </HeaderFirstRow>

            <HeaderSecondRow>
                {/* FIRST ROW - MINED TIME */}
                <SecondRowTitle>
                    {isConfirmed ? (
                        <Translation id="TR_MINED_TIME" />
                    ) : (
                        <Translation id="TR_FIRST_SEEN" />
                    )}
                </SecondRowTitle>
                <SecondRowValue>
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
                </SecondRowValue>

                {/* SECOND ROW - TX ID */}
                <SecondRowTitle>
                    <Translation id="TR_TRANSACTION_ID" />
                </SecondRowTitle>

                <SecondRowValue>
                    <TransactionId>{tx.txid}</TransactionId>{' '}
                </SecondRowValue>
            </HeaderSecondRow>
        </Wrapper>
    );
};

export default BasicDetails;
