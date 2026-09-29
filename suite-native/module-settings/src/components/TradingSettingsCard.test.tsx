import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TradingSettingsCard, type TradingSettingsCardProps } from './TradingSettingsCard';

let mockIsTradingCountrySet: boolean;
let mockIsTradingResidenceWhitelistRequired: boolean;

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingCountrySet: () => mockIsTradingCountrySet,
    selectIsTradingResidenceWhitelistRequired: () => mockIsTradingResidenceWhitelistRequired,
}));

describe('TradingSettingsCard', () => {
    const renderTradingSettingsCard = async (props: Partial<TradingSettingsCardProps> = {}) =>
        await renderWithStoreProvider(<TradingSettingsCard onPress={jest.fn()} {...props} />);

    beforeEach(() => {
        mockIsTradingCountrySet = false;
        mockIsTradingResidenceWhitelistRequired = false;
    });

    it('should not render trading settings button when selectIsTradingResidenceWhitelistRequired is false', async () => {
        const { toJSON } = await renderTradingSettingsCard();

        expect(toJSON()).toBeNull();
    });

    describe('when selectIsTradingResidenceWhitelistRequired is true', () => {
        beforeEach(() => {
            mockIsTradingResidenceWhitelistRequired = true;
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
