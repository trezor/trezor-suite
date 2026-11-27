import { Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow, TradeStatusSubItem } from '@suite-native/trading-atoms';

export type ExchangeConfirmationTransactionIdRowProps = {
    txid: string | null;
    onPress: () => void;
};

export const EXCHANGE_CONFIRMATION_TRANSACTION_ID_ROW_TEST_ID =
    '@trading/exchange-confirmation/transaction-id';

export const ExchangeConfirmationTransactionIdRow = ({
    txid,
    onPress,
}: ExchangeConfirmationTransactionIdRowProps) => {
    if (!txid) {
        return null;
    }

    return (
        <TradeInfoRow onPress={onPress} testID={EXCHANGE_CONFIRMATION_TRANSACTION_ID_ROW_TEST_ID}>
            <Box flex={1}>
                <TradeStatusSubItem
                    label={
                        <Translation id="moduleTrading.tradingConfirmationScreen.transactionId" />
                    }
                    value={txid}
                    onPress={onPress}
                />
            </Box>
        </TradeInfoRow>
    );
};
