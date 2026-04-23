import { fireEvent, renderWithProviders } from '@suite-native/test-utils';

import { CopyableText, type CopyableTextProps } from '../CopyableText';

const mockCopyToClipboard = jest.fn();

jest.mock('@suite-native/clipboard', () => ({
    useCopyToClipboard: () => mockCopyToClipboard,
}));

describe('CopyableText', () => {
    const renderCopyableText = (props: Partial<CopyableTextProps>) =>
        renderWithProviders(<CopyableText text="TEST TEXT" {...props} />, { providers: [] });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render title, text and copy button', () => {
        const { getByText, getByLabelText } = renderCopyableText({
            title: 'Title',
        });

        expect(getByText('TEST TEXT')).toBeOnTheScreen();
        expect(getByText('Title')).toBeOnTheScreen();
        expect(getByLabelText('Copy to clipboard')).toBeOnTheScreen();
    });

    it('should handle copy to clipboard press', () => {
        const { getByLabelText } = renderCopyableText({});

        fireEvent.press(getByLabelText('Copy to clipboard'));

        expect(mockCopyToClipboard).toHaveBeenCalledWith('TEST TEXT');
    });
});
