import React from 'react';
import styled from 'styled-components';
import { Icon, colors, variables, Link, Loader } from '@trezor/components-v2';

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
    margin-left: 1ch;
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
            return 'Outgoing';
        case 'recv':
            return 'Incoming';
        case 'self':
            return 'Sent to self';
        case 'unknown':
            return 'Unknown';
        default:
            return 'Unknown';
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
                <BoxRow title="Status">
                    {isConfirmed ? (
                        <StatusWrapper>
                            <>Confirmed</>
                            {isFetching && (
                                <LoaderIconWrapper>
                                    <Loader size={16} />
                                </LoaderIconWrapper>
                            )}
                            {txDetails?.confirmations && (
                                <Confirmations>
                                    {txDetails.confirmations} confirmations
                                    <ConfirmationsIconWrapper>
                                        <Icon icon="QUESTION" color={colors.BLACK50} size={12} />
                                    </ConfirmationsIconWrapper>
                                </Confirmations>
                            )}
                        </StatusWrapper>
                    ) : (
                        'Unconfirmed'
                    )}
                </BoxRow>

                <BoxRow title="Type">{getHumanReadableTxType(tx)}</BoxRow>

                <BoxRow title={isConfirmed ? 'Mined Time' : 'First Seen'}>
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
                </BoxRow>

                <BoxRow title="Transaction ID">
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
                <BoxRow title="Total Input">{totalInput && `${totalInput} ${assetSymbol}`}</BoxRow>
                <BoxRow title="Total Output">
                    {totalOutput && `${totalOutput} ${assetSymbol}`}
                </BoxRow>
                <BoxRow title="Fee">{`${tx.fee} ${assetSymbol}`}</BoxRow>
                {/* TODO: BlockchainLink doesn't return size/vsize field */}
                {/* {txDetails?.size && <BoxRow title="Size">{`${txDetails.size} B`}</BoxRow>} */}
            </Box>
        </>
    );
};

export default BasicDetails;
