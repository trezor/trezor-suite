import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, userEvent } from '@suite-native/test-utils';

import { ReviewOutputHexData } from './ReviewOutputHexData';

const mockCopyToClipboard = jest.fn();

jest.mock('@suite-native/clipboard', () => ({
    useCopyToClipboard: () => mockCopyToClipboard,
}));

describe('ReviewOutputHexData', () => {
    const renderHexData = async (value: string) =>
        await renderWithBasicProvider(<ReviewOutputHexData value={value} />);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render empty-state translation when value is empty', async () => {
        const { getByText } = await renderHexData('');

        expect(
            getByText(getTranslation('transactionManagement.review.outputs.transactionDataEmpty')),
        ).toBeOnTheScreen();
    });

    it('should render full value when length is at most 300 characters', async () => {
        const value = 'a'.repeat(300);
        const { getByText, queryByText } = await renderHexData(value);

        expect(getByText(value)).toBeOnTheScreen();
        expect(
            queryByText(
                getTranslation('transactionManagement.review.outputs.transactionDataShowMore'),
            ),
        ).toBeNull();
    });

    it('should truncate long value, expand on press, and collapse again', async () => {
        const value = 'b'.repeat(301);
        const truncated = 'b'.repeat(300);
        const showMore = getTranslation(
            'transactionManagement.review.outputs.transactionDataShowMore',
        );
        const showLess = getTranslation(
            'transactionManagement.review.outputs.transactionDataShowLess',
        );

        const { getByText, queryByText } = await renderHexData(value);

        expect(getByText(truncated)).toBeOnTheScreen();
        expect(queryByText(value)).toBeNull();
        expect(getByText(showMore)).toBeOnTheScreen();

        await userEvent.press(getByText(showMore));

        expect(getByText(value)).toBeOnTheScreen();
        expect(getByText(showLess)).toBeOnTheScreen();

        await userEvent.press(getByText(showLess));

        expect(getByText(truncated)).toBeOnTheScreen();
        expect(queryByText(value)).toBeNull();
    });

    it('should expand truncated value when pressing the truncated hex body', async () => {
        const value = 'c'.repeat(301);
        const truncated = 'c'.repeat(300);
        const showLess = getTranslation(
            'transactionManagement.review.outputs.transactionDataShowLess',
        );

        const { getByText } = await renderHexData(value);

        await userEvent.press(getByText(truncated));

        expect(getByText(value)).toBeOnTheScreen();
        expect(getByText(showLess)).toBeOnTheScreen();
    });

    it('should copy full value on long press of the data control', async () => {
        const value = '0xcafe';
        const { getAllByRole } = await renderHexData(value);

        const button = getAllByRole('button')?.[0];
        if (!button) {
            throw new Error('Button not found');
        }
        await userEvent.longPress(button);

        expect(mockCopyToClipboard).toHaveBeenCalledWith(value);
    });
});
