import { type TransactionReviewSummaryOutput } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { Text as MockText } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';

import { TransactionReviewOutputSummaryItem } from './TransactionReviewOutputSummaryItem';
import {
    type TransactionReviewTestProviderProps,
    renderWithTransactionReview,
} from '../__fixtures__/renderWithTransactionReview';
import { BTC_ACCOUNT_KEY, ETH_ACCOUNT_KEY, USDC_CONTRACT } from '../__fixtures__/walletState';

jest.mock('./TransactionReviewOutputItemValues', () => ({
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

describe('TransactionReviewOutputSummaryItem', () => {
    const renderSummary = async (providerProps: TransactionReviewTestProviderProps = {}) =>
        await renderWithTransactionReview(<TransactionReviewOutputSummaryItem />, {
            providerProps: { summaryOutput, ...providerProps },
        });

    it('should render nothing without a summary output', async () => {
        const { toJSON } = await renderSummary({ summaryOutput: undefined });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when the account is unknown', async () => {
        const { toJSON } = await renderSummary({
            accountKey: mockAccountKey({ descriptor: 'unknown' }),
        });

        expect(toJSON()).toBeNull();
    });

    it('should use the summary translation id from the review as title', async () => {
        const { getByTestId } = await renderSummary({
            summaryTranslationId: 'earn.earnSummaryOutputItem.title',
        });

        expect(getByTestId('review-output-card/title')).toHaveTextContent(
            getTranslation('earn.earnSummaryOutputItem.title'),
        );
    });

    it('should render total amount and fee for a network without tokens', async () => {
        const { getByText } = await renderSummary({ accountKey: BTC_ACCOUNT_KEY });

        expect(
            getByText('Values: [transactionManagement.review.outputs.summary.totalAmount]-[1000]'),
        ).toBeOnTheScreen();
        expect(
            getByText('Values: [transactionManagement.review.outputs.summary.fee]-[10]'),
        ).toBeOnTheScreen();
    });

    it('should render amount without fee and max fee for a network with tokens', async () => {
        const { getByText } = await renderSummary({ accountKey: ETH_ACCOUNT_KEY });

        expect(
            getByText('Values: [transactionManagement.review.outputs.summary.amount]-[990]'),
        ).toBeOnTheScreen();
        expect(
            getByText('Values: [transactionManagement.review.outputs.summary.maxFee]-[10]'),
        ).toBeOnTheScreen();
    });

    it('should render the full total as amount for a token transaction', async () => {
        const { getByText } = await renderSummary({
            accountKey: ETH_ACCOUNT_KEY,
            tokenContract: USDC_CONTRACT,
        });

        expect(
            getByText('Values: [transactionManagement.review.outputs.summary.amount]-[1000]'),
        ).toBeOnTheScreen();
        expect(
            getByText('Values: [transactionManagement.review.outputs.summary.maxFee]-[10]'),
        ).toBeOnTheScreen();
    });
});
