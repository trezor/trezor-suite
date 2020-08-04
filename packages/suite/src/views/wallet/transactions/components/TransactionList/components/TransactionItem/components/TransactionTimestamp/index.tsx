/* eslint-disable react/no-array-index-key */
import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { variables, colors, Link } from '@trezor/components';
import { useActions } from '@suite-hooks';
import { getDateWithTimeZone } from '@suite-utils/date';
import * as modalActions from '@suite-actions/modalActions';
import { WalletAccountTransaction } from '@wallet-types';

const TimestampLink = styled(Link)`
    display: block;
    font-variant-numeric: tabular-nums;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.57;
    margin-right: 8px;
    white-space: nowrap;
`;

interface Props {
    transaction: WalletAccountTransaction;
}

const TransactionTimestamp = ({ transaction }: Props) => {
    const { blockTime, blockHeight } = transaction;
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });

    return (
        <TimestampLink
            onClick={() => {
                openModal({
                    type: 'transaction-detail',
                    tx: transaction,
                });
            }}
        >
            {blockHeight !== 0 && blockTime && blockTime > 0 && (
                <FormattedDate
                    value={getDateWithTimeZone(blockTime * 1000)}
                    hour="2-digit"
                    minute="2-digit"
                    // hour12={false}
                />
            )}
        </TimestampLink>
    );
};

export default TransactionTimestamp;
