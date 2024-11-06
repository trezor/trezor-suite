import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

interface CoinmarketTransactionIdProps {
    transactionId: string;
}

export const CoinmarketTransactionId = ({ transactionId }: CoinmarketTransactionIdProps) => (
    <Text margin={{ top: spacings.xs }} variant="tertiary" typographyStyle="label" as="div">
        <Row flexWrap="wrap" gap={spacings.xxs}>
            <Translation id="TR_COINMARKET_TRANS_ID" />
            <Text>{transactionId}</Text>
        </Row>
    </Text>
);
