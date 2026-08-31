import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, userEvent } from '@suite-native/test-utils';

import { ExplanationText } from './ExplanationText';

const mockShowAlert = jest.fn();

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({ showAlert: mockShowAlert }),
}));

describe('ExplanationText', () => {
    beforeEach(() => {
        mockShowAlert.mockClear();
    });

    it('renders an accessible explanation trigger', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <ExplanationText
                testID="@test/explanation"
                title="Explanation title"
                description="Explanation description"
            >
                Explained value
            </ExplanationText>,
        );

        expect(getByTestId('@test/explanation/button')).toBeOnTheScreen();
    });

    it('opens a left-aligned explanation alert', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <ExplanationText
                title="Explanation title"
                description="Explanation description"
                testID="@test/explanation"
            >
                Explained value
            </ExplanationText>,
        );

        await userEvent.press(getByTestId('@test/explanation/button'));

        expect(mockShowAlert).toHaveBeenCalledWith({
            title: 'Explanation title',
            description: 'Explanation description',
            textAlign: 'left',
            titleSpacing: 'sp4',
            primaryButtonTitle: expect.objectContaining({
                props: { id: 'generic.buttons.gotIt' },
            }),
            isClosableByOutsidePress: true,
            testID: '@test/explanation/alert',
        });
        expect(getTranslation('generic.buttons.gotIt')).toBe('Got it');
    });
});
