import type { TranslationKey } from '@suite/intl';
import { Translation } from '@suite/intl';
import type { YieldPendingTransactionState } from '@suite-common/wallet-core';
import { PendingTransactionInfo } from '@trezor/product-components';

import { Address } from 'src/components/suite/Address';

type YieldPendingTransactionProps = {
    pendingTransaction: YieldPendingTransactionState;
    onTxClick: (txid: string) => void;
};

const getPendingTransactionLabel = (kind: YieldPendingTransactionState['type']): TranslationKey => {
    switch (kind) {
        case 'approve':
            return 'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL';
        case 'revoke':
        case 'revoke-only':
            return 'TR_EXCHANGE_APPROVAL_FORM_REVOKING_APPROVAL';
        case 'deposit':
            return 'TR_EARN_YIELD_PENDING_SUPPLY';
        case 'withdraw':
            return 'TR_EARN_YIELD_PENDING_WITHDRAW';
        case 'claim':
            return 'TR_EARN_YIELD_PENDING_CLAIM';
    }
};

export const YieldPendingTransaction = ({
    pendingTransaction,
    onTxClick,
}: YieldPendingTransactionProps) => (
    <PendingTransactionInfo
        title={<Translation id={getPendingTransactionLabel(pendingTransaction.type)} />}
        txidLabel={<Translation id="TR_EXCHANGE_APPROVAL_FORM_TRANSACTION_ID" />}
        txidComponent={
            <Address
                isTruncated
                isChunked={false}
                value={pendingTransaction.txid}
                intent="brand"
                typographyStyle="body-md"
            />
        }
        onTxClick={() => onTxClick(pendingTransaction.txid)}
    />
);
