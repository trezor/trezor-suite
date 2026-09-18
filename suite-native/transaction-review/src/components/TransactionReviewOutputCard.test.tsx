import { type TransactionReviewOutputState } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TransactionReviewOutputCard } from './TransactionReviewOutputCard';

describe('TransactionReviewOutputCard', () => {
    const renderCard = async (outputState: TransactionReviewOutputState) =>
        await renderWithBasicProvider(
            <TransactionReviewOutputCard title="Card title" outputState={outputState}>
                <Text>Card content</Text>
            </TransactionReviewOutputCard>,
        );

    it.each<TransactionReviewOutputState>(['active', 'success', undefined])(
        'should render title and content for state "%s"',
        async outputState => {
            const { getByTestId } = await renderCard(outputState);

            expect(getByTestId('review-output-card/title')).toHaveTextContent('Card title');
            expect(getByTestId('review-output-card/content')).toHaveTextContent('Card content');
        },
    );

    it('should render a custom node as title', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <TransactionReviewOutputCard
                title={<Text testID="custom-title">Custom</Text>}
                outputState="active"
            >
                <Text>Card content</Text>
            </TransactionReviewOutputCard>,
        );

        expect(getByTestId('custom-title')).toBeOnTheScreen();
    });
});
