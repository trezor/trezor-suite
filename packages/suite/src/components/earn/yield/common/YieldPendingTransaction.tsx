import type { TranslationKey } from '@suite/intl';
import { Translation } from '@suite/intl';
import type { YieldPendingTransactionState } from '@suite-common/wallet-core';
import { Column, Link, Paragraph, Row, Spinner } from '@trezor/components';

import { Address } from 'src/components/suite/Address';

type YieldPendingTransactionProps = {
    pendingTransaction: YieldPendingTransactionState;
    onTxClick?: (txid: string) => void;
};

const getPendingTransactionLabel = (kind: YieldPendingTransactionState['type']): TranslationKey => {
    switch (kind) {
        case 'approve':
            return 'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL';
        case 'revoke':
        case 'revoke-only':
            return 'TR_EXCHANGE_APPROVAL_FORM_REVOKING_APPROVAL';
        case 'supply':
            return 'TR_EARN_YIELD_PENDING_SUPPLY';
        case 'withdraw':
            return 'TR_EARN_YIELD_PENDING_WITHDRAW';
    }
};

export const YieldPendingTransaction = ({
    pendingTransaction,
    onTxClick,
}: YieldPendingTransactionProps) => {
    const txidComponent = (
        <Address
            isTruncated
            isChunked={false}
            value={pendingTransaction.txid}
            intent="brand"
            typographyStyle="body-md"
        />
    );

    return (
        <Column width="100%" alignItems="flex-start">
            <Row alignItems="flex-start" gap={12}>
                <Spinner size={20} />

                <Column>
                    <Paragraph
                        typographyStyle="body-md"
                        intent="neutral"
                        priority="secondary"
                        align="start"
                    >
                        <Translation id={getPendingTransactionLabel(pendingTransaction.type)} />
                    </Paragraph>

                    <Row gap={4} flexWrap="wrap" alignItems="center">
                        <Paragraph
                            typographyStyle="body-md"
                            intent="neutral"
                            priority="secondary"
                            align="start"
                        >
                            <Translation id="TR_EXCHANGE_APPROVAL_FORM_TRANSACTION_ID" />
                        </Paragraph>

                        {onTxClick ? (
                            <Link onClick={() => onTxClick(pendingTransaction.txid)}>
                                {txidComponent}
                            </Link>
                        ) : (
                            txidComponent
                        )}
                    </Row>
                </Column>
            </Row>
        </Column>
    );
};
