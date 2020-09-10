import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { Icon, colors, variables, Link, Loader, Tooltip } from '@trezor/components';
import { Translation, HiddenPlaceholder } from '@suite-components';
import Box from '../Box';
import BoxRow from '../BoxRow';
import { getDateWithTimeZone } from '@suite-utils/date';
import { WalletAccountTransaction } from '@wallet-types';
import FormattedCryptoAmount from '@suite/components/suite/FormattedCryptoAmount';

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
    font-variant-numeric: slashed-zero tabular-nums;
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
    confirmations,
    isFetching,
    explorerUrl,
    totalInput,
    totalOutput,
}: Props) => {
    const isConfirmed = confirmations > 0;

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
                        <HiddenPlaceholder>
                            <FormattedCryptoAmount value={totalInput} symbol={assetSymbol} />
                        </HiddenPlaceholder>
                    </BoxRow>
                )}
                {totalOutput && (
                    <BoxRow title={<Translation id="TR_TOTAL_OUTPUT" />}>
                        <HiddenPlaceholder>
                            <FormattedCryptoAmount value={totalOutput} symbol={assetSymbol} />
                        </HiddenPlaceholder>
                    </BoxRow>
                )}
                <BoxRow title={<Translation id="AMOUNT" />}>
                    <HiddenPlaceholder>
                        <FormattedCryptoAmount value={tx.amount} symbol={assetSymbol} />
                    </HiddenPlaceholder>
                </BoxRow>
                <BoxRow title={<Translation id="TR_TX_FEE" />}>
                    <HiddenPlaceholder>
                        <FormattedCryptoAmount value={tx.fee} symbol={assetSymbol} />
                    </HiddenPlaceholder>
                </BoxRow>
                {/* TODO: BlockchainLink doesn't return size/vsize field */}
                {/* {txDetails?.size && <BoxRow title="Size">{`${txDetails.size} B`}</BoxRow>} */}
            </Box>
        </>
    );
};

export default BasicDetails;
