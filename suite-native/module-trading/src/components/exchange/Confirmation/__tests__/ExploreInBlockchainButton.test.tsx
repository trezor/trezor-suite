import { Linking } from 'react-native';

import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen, userEvent } from '@suite-native/test-utils';

import { ExploreInBlockchainButton } from '../ExploreInBlockchainButton';

describe('ExploreInBlockchainButton', () => {
    const mockOpenURL = jest.spyOn(Linking, 'openURL');

    const renderButton = () => renderWithBasicProvider(<ExploreInBlockchainButton />);

    beforeEach(() => {
        mockOpenURL.mockClear();
    });

    const getButtonByText = () =>
        screen.getByText(
            getTranslation('moduleTrading.tradingConfirmationScreen.exploreInBlockchain'),
        );

    it('should render button with correct label', () => {
        renderButton();

        expect(getButtonByText()).toBeOnTheScreen();
    });

    it('should open URL when pressed', async () => {
        renderButton();

        await userEvent.press(getButtonByText());

        expect(mockOpenURL).toHaveBeenCalledTimes(1);
        expect(mockOpenURL).toHaveBeenCalledWith('https://trezor.io/');
    });
});
