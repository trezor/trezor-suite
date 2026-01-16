import { Translation } from '@suite/intl';
import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface TradingTransactionIdProps {
    transactionId: string;
}

export const TradingTransactionId = ({ transactionId }: TradingTransactionIdProps) => (
    <Text margin={{ top: spacings.xs }} variant="tertiary" typographyStyle="label" as="div">
        <Row flexWrap="wrap" gap={spacings.xxs}>
            <Translation id="TR_TRADING_TRANS_ID" />
            <Text>{transactionId}</Text>
        </Row>
    </Text>
);
