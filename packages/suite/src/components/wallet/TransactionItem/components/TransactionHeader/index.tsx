import React from 'react';
import { Translation } from '@suite-components';
import { getTxHeaderSymbol, isTxUnknown } from '@wallet-utils/transactionUtils';
import { WalletAccountTransaction } from '@wallet-types';

interface Props {
    transaction: WalletAccountTransaction;
    isPending: boolean;
}

const TransactionHeader = ({ transaction, isPending }: Props) => {
    let heading = null;
    const nTokens = transaction.tokens.length;
    const isMultiTokenTransaction = nTokens > 1;
    const symbol = getTxHeaderSymbol(transaction).toUpperCase();
    const transfer = transaction.tokens[0];

    // We have types: sent, recv, self, failed. We miss approve, swap, ...
    const headingTxType = nTokens ? transfer.type : transaction.type;
    if (isTxUnknown(transaction)) {
        heading = <Translation id="TR_UNKNOWN_TRANSACTION" />;
    } else if (headingTxType === 'sent') {
        heading = (
            <Translation
                id={isPending ? 'TR_SENDING_SYMBOL' : 'TR_SENT_SYMBOL'}
                values={{ symbol, multiple: isMultiTokenTransaction }}
            />
        );
    } else if (headingTxType === 'recv') {
        heading = (
            <Translation
                id={isPending ? 'TR_RECEIVING_SYMBOL' : 'TR_RECEIVED_SYMBOL'}
                values={{ symbol, multiple: isMultiTokenTransaction }}
            />
        );
    } else if (headingTxType === 'self') {
        if (transaction.cardanoSpecific?.subtype === 'withdrawal') {
            heading = <Translation id="TR_REWARDS_WITHDRAWAL" />;
        } else if (transaction.cardanoSpecific?.subtype === 'stake_delegation') {
            heading = <Translation id="TR_STAKE_DELEGATED" />;
        } else if (transaction.cardanoSpecific?.subtype === 'stake_registration') {
            heading = <Translation id="TR_STAKE_REGISTERED" />;
        } else if (transaction.cardanoSpecific?.subtype === 'stake_deregistration') {
            heading = <Translation id="TR_STAKE_DEREGISTERED" />;
        } else {
            heading = (
                <Translation
                    id={isPending ? 'TR_SENDING_SYMBOL_TO_SELF' : 'TR_SENT_SYMBOL_TO_SELF'}
                    values={{ symbol, multiple: isMultiTokenTransaction }}
                />
            );
        }
    } else if (headingTxType === 'failed') {
        heading = <Translation id="TR_FAILED_TRANSACTION" />;
    } else {
        heading = <Translation id="TR_UNKNOWN_TRANSACTION" />;
    }
    return heading;
};

export default TransactionHeader;
