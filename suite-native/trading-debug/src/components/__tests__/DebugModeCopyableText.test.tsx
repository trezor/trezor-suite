import { renderWithBasicProvider } from '@suite-native/test-utils';

import { DebugModeCopyableText, type DebugModeCopyableTextProps } from '../DebugModeCopyableText';

let mockDebugMode: boolean;

jest.mock('../../hooks/useTradingDebugModeFlag', () => ({
    useTradingDebugModeFlag: () => mockDebugMode,
}));

describe('DebugModeCopyableText', () => {
    const renderDebugModeCopyableText = (props: Partial<DebugModeCopyableTextProps>) =>
        renderWithBasicProvider(<DebugModeCopyableText text="TEST TEXT" {...props} />);

    beforeEach(() => {
        mockDebugMode = true;
    });

    it('should render nothing when debug mode is disabled', () => {
        mockDebugMode = false;

        const { toJSON } = renderDebugModeCopyableText({});

        expect(toJSON()).toBeNull();
    });

    it('should render title, text and copy button', () => {
        const { getByText, getByLabelText } = renderDebugModeCopyableText({
            title: 'Title',
        });

        expect(getByText('TEST TEXT')).toBeOnTheScreen();
        expect(getByText('Title')).toBeOnTheScreen();
        expect(getByLabelText('Copy to clipboard')).toBeOnTheScreen();
    });
});
