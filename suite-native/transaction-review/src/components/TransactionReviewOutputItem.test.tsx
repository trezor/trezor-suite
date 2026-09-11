import { type TransactionReviewStatefulOutput } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';

import { TransactionReviewOutputItem } from './TransactionReviewOutputItem';
import {
    type TransactionReviewTestProviderProps,
    renderWithTransactionReview,
} from '../__fixtures__/renderWithTransactionReview';

const noteOutput: TransactionReviewStatefulOutput = {
    type: 'note',
    value: 'default note value',
    state: 'active',
};

describe('TransactionReviewOutputItem', () => {
    const renderItem = async (providerProps: TransactionReviewTestProviderProps = {}) =>
        await renderWithTransactionReview(
            <TransactionReviewOutputItem output={noteOutput} onLayout={jest.fn()} />,
            { providerProps },
        );

    it('should render the default label and content', async () => {
        const { getByTestId } = await renderItem();

        expect(getByTestId('review-output-card/title')).toHaveTextContent(
            getTranslation('transactionManagement.review.outputs.noteLabel'),
        );
        expect(getByTestId('review-output-card/content')).toHaveTextContent('default note value');
    });

    it('should use the title override when it returns a node', async () => {
        const outputTitleOverride = jest.fn(() => <Text>Custom title</Text>);

        const { getByTestId } = await renderItem({ outputTitleOverride });

        expect(outputTitleOverride).toHaveBeenCalledWith(noteOutput);
        expect(getByTestId('review-output-card/title')).toHaveTextContent('Custom title');
        expect(getByTestId('review-output-card/content')).toHaveTextContent('default note value');
    });

    it('should use the content override when it returns a node', async () => {
        const outputOverride = jest.fn(() => <Text>Custom content</Text>);

        const { getByTestId } = await renderItem({ outputOverride });

        expect(outputOverride).toHaveBeenCalledWith(noteOutput);
        expect(getByTestId('review-output-card/content')).toHaveTextContent('Custom content');
        expect(getByTestId('review-output-card/title')).toHaveTextContent(
            getTranslation('transactionManagement.review.outputs.noteLabel'),
        );
    });

    it('should fall back to the defaults when overrides return undefined', async () => {
        const { getByTestId } = await renderItem({
            outputTitleOverride: () => undefined,
            outputOverride: () => undefined,
        });

        expect(getByTestId('review-output-card/title')).toHaveTextContent(
            getTranslation('transactionManagement.review.outputs.noteLabel'),
        );
        expect(getByTestId('review-output-card/content')).toHaveTextContent('default note value');
    });
});
