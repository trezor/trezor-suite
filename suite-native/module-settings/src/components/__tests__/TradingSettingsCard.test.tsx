// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';

import { TradingSettingsCard, TradingSettingsCardProps } from '../TradingSettingsCard';

let mockIsTradingCountrySet: boolean;
let mockIsTradingResidenceCheckEnabled: boolean;

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingCountrySet: () => mockIsTradingCountrySet,
    selectIsTradingResidenceCheckEnabled: () => mockIsTradingResidenceCheckEnabled,
}));

describe('TradingSettingsCard', () => {
    const renderTradingSettingsCard = (props: Partial<TradingSettingsCardProps> = {}) =>
        renderWithStoreProviderAsync(<TradingSettingsCard onPress={jest.fn()} {...props} />);

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
            expect(getByText('Enable trading')).toBeOnTheScreen();
            expect(getByText('Confirm your country of residence')).toBeOnTheScreen();
        });

        it('should render "Trading" button when selectIsTradingCountrySet is true', async () => {
            mockIsTradingCountrySet = true;
            const { getByTestId, getByText } = await renderTradingSettingsCard({
                testID: '@settings/trading',
            });

            expect(getByTestId('@settings/trading')).toBeOnTheScreen();
            expect(getByText('Trading')).toBeOnTheScreen();
            expect(getByText('Country of residence')).toBeOnTheScreen();
        });
    });
});
