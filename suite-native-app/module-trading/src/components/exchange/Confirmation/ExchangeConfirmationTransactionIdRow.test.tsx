import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import {
    EXCHANGE_CONFIRMATION_TRANSACTION_ID_ROW_TEST_ID,
    ExchangeConfirmationTransactionIdRow,
} from './ExchangeConfirmationTransactionIdRow';

const TXID = '0xabc123';

describe('ExchangeConfirmationTransactionIdRow', () => {
    it('renders the transaction ID', async () => {
        await renderWithBasicProvider(
            <ExchangeConfirmationTransactionIdRow txid={TXID} onPress={jest.fn()} />,
        );

        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingConfirmationScreen.transactionId'),
            ),
        ).toBeOnTheScreen();
        expect(screen.getByText(TXID)).toBeOnTheScreen();
    });

    it('renders nothing without a transaction ID', async () => {
        await renderWithBasicProvider(
            <ExchangeConfirmationTransactionIdRow txid={null} onPress={jest.fn()} />,
        );

        expect(
            screen.queryByTestId(EXCHANGE_CONFIRMATION_TRANSACTION_ID_ROW_TEST_ID),
        ).not.toBeOnTheScreen();
    });
});
