import { notificationsActions } from '@suite-common/toast-notifications';
import { Button, Row, Text } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

interface TradingTransactionIdProps {
    transactionId: string;
}

export const TradingTransactionId = ({ transactionId }: TradingTransactionIdProps) => {
    const dispatch = useDispatch();
    const copy = () => {
        const result = copyToClipboard(transactionId);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return (
        <Row margin={{ top: spacings.sm }} gap={spacings.xs}>
            <Text
                variant="tertiary"
                typographyStyle="label"
                as="div"
                data-testid="@trading/transaction-id"
                ellipsisLineCount={1}
            >
                <Translation id="TR_TRADING_TRANS_ID" /> {transactionId}
            </Text>
            <Button size="tiny" variant="tertiary" onClick={copy}>
                <Translation id="TR_COPY_TO_CLIPBOARD" />
            </Button>
        </Row>
    );
};
