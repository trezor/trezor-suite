import { Translation } from '@suite/intl';
import { Row, Text } from '@trezor/components';

interface TradingTransactionIdProps {
    transactionId: string;
}

export const TradingTransactionId = ({ transactionId }: TradingTransactionIdProps) => (
    <Text
        margin={{ top: 8 }}
        intent="neutral"
        priority="secondary"
        typographyStyle="body-xs"
        as="div"
    >
        <Row flexWrap="wrap" gap={4}>
            <Translation id="TR_TRADING_TRANS_ID" />
            <Text>{transactionId}</Text>
        </Row>
    </Text>
);
