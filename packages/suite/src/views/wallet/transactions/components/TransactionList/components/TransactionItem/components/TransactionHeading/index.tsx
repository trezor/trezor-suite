import React from 'react';
import { WalletAccountTransaction } from '@wallet-types';
import { Translation } from '@suite-components';
import { isTxUnknown } from '@wallet-utils/transactionUtils';

interface Props {
    transaction: WalletAccountTransaction;
    isPending: boolean;
}

const TransactionHeading = ({ transaction, isPending }: Props) => {
    // TODO: intl once the structure and all combinations are decided
    let heading = null;
    const symbol = transaction.symbol.toUpperCase();
    if (isTxUnknown(transaction)) {
        heading = <Translation id="TR_UNKNOWN_TRANSACTION" />;
    } else if (transaction.type === 'sent') {
        heading = isPending ? `Sending ${symbol}` : `Sent ${symbol}`;
    } else if (transaction.type === 'recv') {
        heading = isPending ? `Receiving ${symbol}` : `Received ${symbol}`;
    } else if (transaction.type === 'self') {
        heading = isPending ? `Sending ${symbol} to myself` : `Sent ${symbol} to myself`;
    } else {
        heading = `Unknown ${symbol} transaction`;
    }
    return <>{heading}</>;
};

export default TransactionHeading;
