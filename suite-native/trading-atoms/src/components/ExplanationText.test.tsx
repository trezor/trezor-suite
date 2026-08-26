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

    it('renders an accessible explanation trigger', () => {
        const { getByRole, getByText } = renderWithBasicProvider(
            <ExplanationText title="Explanation title" description="Explanation description">
                Explained value
            </ExplanationText>,
        );

        expect(getByText('Explained value')).toBeOnTheScreen();
        expect(getByRole('button', { name: 'Explained value' })).toBeOnTheScreen();
    });

    it('opens a left-aligned explanation alert', async () => {
        const { getByRole } = renderWithBasicProvider(
            <ExplanationText
                title="Explanation title"
                description="Explanation description"
                testID="@test/explanation"
            >
                Explained value
            </ExplanationText>,
        );

        await userEvent.press(getByRole('button', { name: 'Explained value' }));

        expect(mockShowAlert).toHaveBeenCalledWith({
            title: 'Explanation title',
            description: 'Explanation description',
            textAlign: 'left',
            titleSpacing: 'sp4',
            primaryButtonTitle: expect.objectContaining({
                props: { id: 'generic.buttons.gotIt' },
            }),
            testID: '@test/explanation/alert',
        });
        expect(getTranslation('generic.buttons.gotIt')).toBe('Got it');
    });
});
