import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen, userEvent } from '@suite-native/test-utils';

import { ExploreInBlockchainButton } from '../ExploreInBlockchainButton';

describe('ExploreInBlockchainButton', () => {
    const getButtonByText = () =>
        screen.getByText(
            getTranslation('moduleTrading.tradingConfirmationScreen.exploreInBlockchain'),
        );

    it('renders the button with correct label', () => {
        renderWithBasicProvider(<ExploreInBlockchainButton onPress={jest.fn()} />);

        expect(getButtonByText()).toBeOnTheScreen();
    });

    it('calls onPress when pressed', async () => {
        const onPress = jest.fn();
        renderWithBasicProvider(<ExploreInBlockchainButton onPress={onPress} />);

        await userEvent.press(getButtonByText());

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
