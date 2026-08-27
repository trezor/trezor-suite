import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TradingSettingsCard, type TradingSettingsCardProps } from './TradingSettingsCard';

let mockIsTradingCountrySet: boolean;
let mockIsTradingResidenceCheckEnabled: boolean;

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingCountrySet: () => mockIsTradingCountrySet,
    selectIsTradingResidenceCheckEnabled: () => mockIsTradingResidenceCheckEnabled,
}));

describe('TradingSettingsCard', () => {
    const renderTradingSettingsCard = async (props: Partial<TradingSettingsCardProps> = {}) =>
        await renderWithStoreProvider(<TradingSettingsCard onPress={jest.fn()} {...props} />);

    beforeEach(() => {
        mockIsTradingCountrySet = false;
        mockIsTradingResidenceCheckEnabled = false;
    });

    it('should not render trading settings button when selectIsTradingResidenceCheckEnabled is false', async () => {
        const { toJSON } = await renderTradingSettingsCard();

        expect(toJSON()).toBeNull();
    });

    describe('when selectIsTradingResidenceCheckEnabled is true', () => {
        beforeEach(() => {
            mockIsTradingResidenceCheckEnabled = true;
        });

        it('should render "Enable trading" button when selectIsTradingCountrySet is false', async () => {
            const { getByTestId, getByText } = await renderTradingSettingsCard({
                testID: '@settings/trading',
            });

            expect(getByTestId('@settings/trading')).toBeOnTheScreen();
            expect(
                getByText(getTranslation('moduleSettings.items.general.trading.titleInactive')),
            ).toBeOnTheScreen();
            expect(
                getByText(getTranslation('moduleSettings.items.general.trading.subtitleInactive')),
            ).toBeOnTheScreen();
        });

        it('should render "Trading" button when selectIsTradingCountrySet is true', async () => {
            mockIsTradingCountrySet = true;
            const { getByTestId, getByText } = await renderTradingSettingsCard({
                testID: '@settings/trading',
            });

            expect(getByTestId('@settings/trading')).toBeOnTheScreen();
            expect(
                getByText(getTranslation('moduleSettings.items.general.trading.title')),
            ).toBeOnTheScreen();
            expect(
                getByText(getTranslation('moduleSettings.items.general.trading.subtitle')),
            ).toBeOnTheScreen();
        });
    });
});
