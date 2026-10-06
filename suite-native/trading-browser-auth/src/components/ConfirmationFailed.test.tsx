import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { ConfirmationFailed } from './ConfirmationFailed';

const mockNavigateBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        goBack: mockNavigateBack,
    }),
}));

describe('ConfirmationFailed', () => {
    const renderConfirmationFailed = async () =>
        await renderWithBasicProvider(<ConfirmationFailed />);

    it('should navigate back on button press', async () => {
        const { getByText } = await renderConfirmationFailed();

        await fireEvent.press(
            getByText(
                getTranslation(
                    'moduleTrading.tradingSellPreviewScreen.providerStatus.cannotBeCompletedAlert.button',
                ),
            ),
        );

        expect(mockNavigateBack).toHaveBeenCalledTimes(1);
    });
});
