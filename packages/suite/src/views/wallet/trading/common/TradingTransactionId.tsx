import { useDispatch } from 'react-redux';

import { Translation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Button, Row, Text } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';

interface TradingTransactionIdProps {
    transactionId: string;
}

export const TradingTransactionId = ({ transactionId }: TradingTransactionIdProps) => {
    const dispatch = useDispatch();
    const copy = async () => {
        const result = await copyToClipboard(transactionId);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return (
        <Row margin={{ top: 12 }} gap={8}>
            <Text
                intent="neutral"
                priority="secondary"
                typographyStyle="body-xs"
                as="div"
                data-testid="@trading/transaction-id"
                ellipsisLineCount={1}
            >
                <Translation id="TR_TRADING_TRANS_ID" /> {transactionId}
            </Text>
            <Button size="small" intent="neutral" priority="secondary" onClick={copy}>
                <Translation id="TR_COPY_TO_CLIPBOARD" />
            </Button>
        </Row>
    );
};
