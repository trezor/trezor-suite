import React from 'react';
import styled from 'styled-components';
import { Icon, colors, variables, Link, Loader, Tooltip } from '@trezor/components';
import { Translation, HiddenPlaceholder } from '@suite-components';
import messages from '@suite/support/messages';
import { FormattedDate } from 'react-intl';
import Box from '../Box';
import BoxRow from '../BoxRow';
import { getDateWithTimeZone } from '@suite-utils/date';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';

const COLOR_TEXT_PRIMARY = colors.BLACK0;

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
    margin-left: 0.5ch;
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
            return <Translation {...messages.TR_OUTGOING} />;
        case 'recv':
            return <Translation {...messages.TR_INCOMING} />;
        case 'self':
            return <Translation {...messages.TR_SENT_TO_SELF} />;
        case 'unknown':
            return <Translation {...messages.TR_UNKNOWN} />;
        default:
            return <Translation {...messages.TR_UNKNOWN} />;
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
            <Box>
                <BoxRow title={<Translation {...messages.TR_STATUS} />}>
                    {isConfirmed ? (
                        <StatusWrapper>
                            <>
                                <Translation {...messages.TR_CONFIRMED_TX} />
                            </>
                            {isFetching && (
                                <LoaderIconWrapper>
                                    <Loader size={16} />
                                </LoaderIconWrapper>
                            )}
                            {txDetails?.confirmations && (
                                <Confirmations>
                                    <Translation
                                        {...messages.TR_TX_CONFIRMATIONS}
                                        values={{ confirmationsCount: txDetails.confirmations }}
                                    />
                                    <ConfirmationsIconWrapper>
                                        <Tooltip
                                            placement="top"
                                            content={
                                                <Translation
                                                    {...messages.TX_CONFIRMATIONS_EXPLAIN}
                                                />
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
                        <Translation {...messages.TR_UNCONFIRMED_TX} />
                    )}
                </BoxRow>

                <BoxRow title={<Translation {...messages.TR_TX_TYPE} />}>
                    {getHumanReadableTxType(tx)}
                </BoxRow>

                <BoxRow
                    title={
                        isConfirmed ? (
                            <Translation {...messages.TR_MINED_TIME} />
                        ) : (
                            <Translation {...messages.TR_FIRST_SEEN} />
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
                        <Translation {...messages.TR_UNKNOWN_CONFIRMATION_TIME} />
                    )}
                </BoxRow>

                <BoxRow title={<Translation {...messages.TR_TRANSACTION_ID} />}>
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
                </BoxRow>
            </Box>

            <Box>
                <BoxRow title={<Translation {...messages.TR_TOTAL_INPUT} />}>
                    <HiddenPlaceholder>
                        {totalInput && `${totalInput} ${assetSymbol}`}
                    </HiddenPlaceholder>
                </BoxRow>
                <BoxRow title={<Translation {...messages.TR_TOTAL_OUTPUT} />}>
                    <HiddenPlaceholder>
                        {totalOutput && `${totalOutput} ${assetSymbol}`}
                    </HiddenPlaceholder>
                </BoxRow>
                <BoxRow title={<Translation {...messages.TR_TX_FEE} />}>
                    <HiddenPlaceholder>{`${tx.fee} ${assetSymbol}`}</HiddenPlaceholder>
                </BoxRow>
                {/* TODO: BlockchainLink doesn't return size/vsize field */}
                {/* {txDetails?.size && <BoxRow title="Size">{`${txDetails.size} B`}</BoxRow>} */}
            </Box>
        </>
    );
};

export default BasicDetails;
