import { type ReactNode } from 'react';
import { useDispatch } from 'react-redux';

import { Address } from '@suite/address';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import {
    PENDING_TRANSACTION_TIME_ESTIMATE_SECONDS,
    PendingTransactionInfo,
} from '@trezor/product-components';

import { useTronStakeContext } from './TronStakeContext';

interface TronStakePendingTransactionProps {
    title: ReactNode;
}

export const TronStakePendingTransaction = ({ title }: TronStakePendingTransactionProps) => {
    const dispatch = useDispatch();
    const { account, actions } = useTronStakeContext();
    const { pendingTxid } = actions;

    if (!pendingTxid) {
        return null;
    }

    return (
        <PendingTransactionInfo
            title={title}
            txidLabel={<Translation id="TR_EXCHANGE_APPROVAL_FORM_TRANSACTION_ID" />}
            txidComponent={
                <Address
                    isTruncated
                    isChunked={false}
                    value={pendingTxid}
                    intent="brand"
                    typographyStyle="body-md"
                />
            }
            timeEstimateSeconds={PENDING_TRANSACTION_TIME_ESTIMATE_SECONDS}
            onTxClick={() =>
                dispatch(
                    openModal({
                        type: 'transaction-detail',
                        txid: pendingTxid,
                        descriptor: account.descriptor,
                        symbol: account.symbol,
                        deviceState: account.deviceState,
                        flow: 'detail',
                    }),
                )
            }
        />
    );
};
