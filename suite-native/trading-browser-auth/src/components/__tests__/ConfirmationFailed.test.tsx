import { fireEvent, renderWithProviders } from '@suite-native/test-utils';

import { ConfirmationFailed } from '../ConfirmationFailed';

const mockNavigateBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        goBack: mockNavigateBack,
    }),
}));

describe('ConfirmationFailed', () => {
    const renderConfirmationFailed = () =>
        renderWithProviders(<ConfirmationFailed />, { providers: ['intl', 'navigation'] });

    it('should navigate back on button press', () => {
        const { getByText } = renderConfirmationFailed();

        fireEvent.press(getByText('Start a new sell'));

        expect(mockNavigateBack).toHaveBeenCalledTimes(1);
    });
});
