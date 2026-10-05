import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TransactionReviewSummaryOutput } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { Text as MockText } from '@suite-native/atoms';

import {
    TradingTransactionReviewSummaryCard,
    type TradingTransactionReviewSummaryCardProps,
} from './TradingTransactionReviewSummaryCard';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

jest.mock('@suite-native/transaction-review', () => ({
    ...jest.requireActual('@suite-native/transaction-review'),
    TransactionReviewOutputItemValues: ({
        translationKey,
        value,
    }: {
        translationKey: string;
        value: string;
    }) => (
        <MockText>
            Values: [{translationKey}]-[{value}]
        </MockText>
    ),
}));

const summaryOutput: TransactionReviewSummaryOutput = {
    totalSpent: '1000',
    fee: '10',
    state: 'active',
};

describe('TradingTransactionReviewSummaryCard', () => {
    const renderSummaryCard = async (
        props: Pick<TradingTransactionReviewSummaryCardProps, 'symbol'>,
    ) =>
        await renderWithTradingProvider(
            <TradingTransactionReviewSummaryCard
                accountKey={mockAccountKey({ descriptor: 'accountKey' })}
                onLayout={jest.fn()}
                summaryOutput={summaryOutput}
                flowType="swap"
                prefix="trading-exchange"
                {...props}
            />,
            { tradeType: 'exchange' },
        );

    it('should render total amount including fee for a Cardano swap', async () => {
        const { getByText } = await renderSummaryCard({ symbol: asNetworkSymbol('ada') });

        expect(
            getByText('Values: [transactionManagement.review.outputs.summary.totalAmount]-[1000]'),
        ).toBeOnTheScreen();
        expect(
            getByText('Values: [transactionManagement.review.outputs.summary.fee]-[10]'),
        ).toBeOnTheScreen();
    });

    it('should render amount without fee and max fee for an Ethereum swap', async () => {
        const { getByText } = await renderSummaryCard({ symbol: asNetworkSymbol('eth') });

        expect(
            getByText('Values: [transactionManagement.review.outputs.summary.amount]-[990]'),
        ).toBeOnTheScreen();
        expect(
            getByText('Values: [transactionManagement.review.outputs.summary.maxFee]-[10]'),
        ).toBeOnTheScreen();
    });
});
