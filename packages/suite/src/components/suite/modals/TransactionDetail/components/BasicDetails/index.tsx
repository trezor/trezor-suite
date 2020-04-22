import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { Icon, colors, variables, Link, Loader, Tooltip } from '@trezor/components';
import { Translation, HiddenPlaceholder } from '@suite-components';
import Box from '../Box';
import BoxRow from '../BoxRow';
import { getDateWithTimeZone } from '@suite-utils/date';
import { WalletAccountTransaction } from '@wallet-types';

const COLOR_TEXT_PRIMARY = colors.BLACK0;

const TransactionIdWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%; /* makes text overflow elipsis work */
`;

const TransactionId = styled(props => <HiddenPlaceholder {...props} />)`
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

const Confirmations = styled.div`
    display: flex;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
    margin-left: 1ch;
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

interface Props {
    txDetails: any;
    tx: WalletAccountTransaction;
    isFetching: boolean;
    totalInput?: string;
    totalOutput?: string;
    explorerUrl?: string;
}

const getHumanReadableTxType = (tx: WalletAccountTransaction) => {
    switch (tx.type) {
        case 'sent':
            return <Translation id="TR_OUTGOING" />;
        case 'recv':
            return <Translation id="TR_INCOMING" />;
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
    txDetails,
    isFetching,
    explorerUrl,
    totalInput,
    totalOutput,
}: Props) => {
    const isConfirmed = tx.blockHeight !== 0 && tx.blockTime && tx.blockTime > 0;
    const assetSymbol = tx.symbol.toUpperCase();
    return (
        <>
            <Box coinLogo={tx.symbol}>
                <BoxRow title={<Translation id="TR_TX_TYPE" />}>
                    {getHumanReadableTxType(tx)}
                </BoxRow>

                <BoxRow title={<Translation id="TR_STATUS" />}>
                    {isConfirmed ? (
                        <StatusWrapper>
                            {isFetching && (
                                <LoaderIconWrapper>
                                    <Loader size={16} />
                                </LoaderIconWrapper>
                            )}
                            {txDetails?.confirmations && (
                                <Confirmations>
                                    <Translation
                                        id="TR_TX_CONFIRMATIONS"
                                        values={{ confirmationsCount: txDetails.confirmations }}
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
                            <Translation id="TR_CONFIRMED_TX" />
                        </StatusWrapper>
                    ) : (
                        <Translation id="TR_UNCONFIRMED_TX" />
                    )}
                </BoxRow>

                <BoxRow
                    title={
                        isConfirmed ? (
                            <Translation id="TR_MINED_TIME" />
                        ) : (
                            <Translation id="TR_FIRST_SEEN" />
                        )
                    }
                >
                    {tx.blockTime ? (
                        <FormattedDate
                            value={getDateWithTimeZone(tx.blockTime * 1000) ?? undefined}
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
                </BoxRow>

                <BoxRow title={<Translation id="TR_TRANSACTION_ID" />}>
                    {explorerUrl ? (
                        <TransactionIdWrapper>
                            <ExplorerLink variant="nostyle" href={explorerUrl}>
                                <TransactionId>{tx.txid}</TransactionId>
                                <LinkIcon
                                    icon="EXTERNAL_LINK"
                                    size={14}
                                    color={COLOR_TEXT_PRIMARY}
                                />
                            </ExplorerLink>
                        </TransactionIdWrapper>
                    ) : (
                        <TransactionIdWrapper>
                            <TransactionId>{tx.txid}</TransactionId>
                        </TransactionIdWrapper>
                    )}
                </BoxRow>
            </Box>

            <Box>
                {totalInput && (
                    <BoxRow title={<Translation id="TR_TOTAL_INPUT" />}>
                        <HiddenPlaceholder>{`${totalInput} ${assetSymbol}`}</HiddenPlaceholder>
                    </BoxRow>
                )}
                {totalOutput && (
                    <BoxRow title={<Translation id="TR_TOTAL_OUTPUT" />}>
                        <HiddenPlaceholder>{`${totalOutput} ${assetSymbol}`}</HiddenPlaceholder>
                    </BoxRow>
                )}
                <BoxRow title={<Translation id="TR_AMOUNT" />}>
                    <HiddenPlaceholder>{`${tx.amount} ${assetSymbol}`}</HiddenPlaceholder>
                </BoxRow>
                <BoxRow title={<Translation id="TR_TX_FEE" />}>
                    <HiddenPlaceholder>{`${tx.fee} ${assetSymbol}`}</HiddenPlaceholder>
                </BoxRow>
                {/* TODO: BlockchainLink doesn't return size/vsize field */}
                {/* {txDetails?.size && <BoxRow title="Size">{`${txDetails.size} B`}</BoxRow>} */}
            </Box>
        </>
    );
};

export default BasicDetails;
