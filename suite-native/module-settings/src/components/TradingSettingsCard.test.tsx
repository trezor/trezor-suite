import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TradingSettingsCard, type TradingSettingsCardProps } from './TradingSettingsCard';

let mockIsTradingCountrySet: boolean;
let mockIsTradingResidenceSelectionAvailable: boolean;

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingCountrySet: () => mockIsTradingCountrySet,
    selectIsTradingResidenceSelectionAvailable: () => mockIsTradingResidenceSelectionAvailable,
}));

describe('TradingSettingsCard', () => {
    const renderTradingSettingsCard = (props: Partial<TradingSettingsCardProps> = {}) =>
        renderWithStoreProvider(<TradingSettingsCard onPress={jest.fn()} {...props} />);

    beforeEach(() => {
        mockIsTradingCountrySet = false;
        mockIsTradingResidenceSelectionAvailable = false;
    });

    it('should not render trading settings button when selectIsTradingResidenceSelectionAvailable is false', async () => {
        const { toJSON } = await renderTradingSettingsCard();

        expect(toJSON()).toBeNull();
    });

    describe('when selectIsTradingResidenceSelectionAvailable is true', () => {
        beforeEach(() => {
            mockIsTradingResidenceSelectionAvailable = true;
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
