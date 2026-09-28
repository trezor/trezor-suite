import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, userEvent } from '@suite-native/test-utils';

import { TransactionReviewOutputHexData } from './TransactionReviewOutputHexData';

const mockCopyToClipboard = jest.fn();

jest.mock('@suite-native/clipboard', () => ({
    useCopyToClipboard: () => mockCopyToClipboard,
}));

const showMoreLabel = getTranslation(
    'transactionManagement.review.outputs.transactionDataShowMore',
);
const showLessLabel = getTranslation(
    'transactionManagement.review.outputs.transactionDataShowLess',
);

describe('TransactionReviewOutputHexData', () => {
    const renderHexData = async (value: string) =>
        await renderWithBasicProvider(<TransactionReviewOutputHexData value={value} />);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the empty placeholder when value is empty', async () => {
        const { getByText } = await renderHexData('');

        expect(
            getByText(getTranslation('transactionManagement.review.outputs.transactionDataEmpty')),
        ).toBeOnTheScreen();
    });

    it('should render the full value when it is at most 300 characters', async () => {
        const value = 'a'.repeat(300);
        const { getByText, queryByText } = await renderHexData(value);

        expect(getByText(value)).toBeOnTheScreen();
        expect(queryByText(showMoreLabel)).toBeNull();
    });

    it('should truncate a long value, expand on press and collapse again', async () => {
        const value = 'b'.repeat(301);
        const truncated = 'b'.repeat(300);
        const { getByText, queryByText } = await renderHexData(value);

        expect(getByText(truncated)).toBeOnTheScreen();
        expect(queryByText(value)).toBeNull();

        await userEvent.press(getByText(showMoreLabel));

        expect(getByText(value)).toBeOnTheScreen();
        expect(getByText(showLessLabel)).toBeOnTheScreen();

        await userEvent.press(getByText(showLessLabel));

        expect(getByText(truncated)).toBeOnTheScreen();
        expect(queryByText(value)).toBeNull();
    });

    it('should expand when pressing the truncated hex body itself', async () => {
        const value = 'c'.repeat(301);
        const truncated = 'c'.repeat(300);
        const { getByText } = await renderHexData(value);

        await userEvent.press(getByText(truncated));

        expect(getByText(value)).toBeOnTheScreen();
        expect(getByText(showLessLabel)).toBeOnTheScreen();
    });

    it('should copy the full value on long press', async () => {
        const value = '0xcafe';
        const { getByText } = await renderHexData(value);

        await userEvent.longPress(getByText(value));

        expect(mockCopyToClipboard).toHaveBeenCalledWith(value);
    });
});
