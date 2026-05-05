import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Text as MockText } from '@suite-native/atoms';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import {
    ReviewOutputSummaryItem,
    type ReviewOutputSummaryItemProps,
} from '../ReviewOutputSummaryItem';

jest.mock('../ReviewOutputItemValues', () => ({
    ReviewOutputItemValues: ({
        translationKey,
        value,
    }: {
        translationKey: string;
        value: string;
    }) => (
        <MockText>
            ReviewOutputItemValues: [{translationKey}]-[{value}]
        </MockText>
    ),
}));

describe('ReviewOutputSummaryItem', () => {
    const renderReviewOutputSummaryItem = (props: Partial<ReviewOutputSummaryItemProps>) =>
        renderWithBasicProvider(
            <ReviewOutputSummaryItem
                accountKey={
                    'eth-account-1' as AccountKey // Todo: create properly via `createAccountKey()`
                }
                symbol="btc"
                onLayout={jest.fn()}
                {...props}
            />,
        );

    it('should render nothing when summaryOutput is not specified', () => {
        const { toJSON } = renderReviewOutputSummaryItem({});

        expect(toJSON()).toBeNull();
    });

    it('should render "total amount" and "fee" for BTC', () => {
        const { getByText } = renderReviewOutputSummaryItem({
            summaryOutput: {
                totalSpent: '1000',
                fee: '10',
                state: 'active',
            },
        });

        expect(getByText('Total including fee')).toBeOnTheScreen();

        // note that this test mocks the ReviewOutputItemValues component
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.totalAmount]-[1000]',
            ),
        ).toBeTruthy();
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.fee]-[10]',
            ),
        ).toBeTruthy();
    });

    it('should render "amount" and "max fee" for ETH', () => {
        const { getByText } = renderReviewOutputSummaryItem({
            summaryOutput: {
                totalSpent: '1000',
                fee: '10',
                state: 'active',
            },
            symbol: 'eth',
        });

        expect(getByText('Total including fee')).toBeOnTheScreen();

        // note that this test mocks the ReviewOutputItemValues component
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.amount]-[990]',
            ),
        ).toBeTruthy();
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.maxFee]-[10]',
            ),
        ).toBeTruthy();
    });

    it.each<'approve' | 'revoke' | 'revoke-and-approve'>([
        'approve',
        'revoke',
        'revoke-and-approve',
    ])('should not render "amount" for flowType "%s"', flowType => {
        const { getByText, queryByText } = renderReviewOutputSummaryItem({
            summaryOutput: {
                totalSpent: '1000',
                fee: '10',
                state: 'active',
            },
            symbol: 'eth',
            flowType,
        });

        expect(
            queryByText(
                /ReviewOutputItemValues: \[transactionManagement\.review\.outputs\.summary\.amount\]/,
            ),
        ).toBeNull();
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.maxFee]-[10]',
            ),
        ).toBeTruthy();
    });

    it('should render "amount" and "max fee" for USDC', () => {
        const { getByText } = renderReviewOutputSummaryItem({
            summaryOutput: {
                totalSpent: '1000',
                fee: '10',
                state: 'active',
            },
            symbol: 'eth',
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
        });

        expect(getByText('Total including fee')).toBeOnTheScreen();

        // note that this test mocks the ReviewOutputItemValues component
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.amount]-[1000]',
            ),
        ).toBeTruthy();
        expect(
            getByText(
                'ReviewOutputItemValues: [transactionManagement.review.outputs.summary.maxFee]-[10]',
            ),
        ).toBeTruthy();
    });
});
