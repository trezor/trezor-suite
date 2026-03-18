import { renderWithStoreProvider } from '@suite-native/test-utils';

import { TradingSettingsCard, type TradingSettingsCardProps } from '../TradingSettingsCard';

let mockIsTradingCountrySet: boolean;
let mockIsTradingResidenceCheckEnabled: boolean;

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingCountrySet: () => mockIsTradingCountrySet,
    selectIsTradingResidenceCheckEnabled: () => mockIsTradingResidenceCheckEnabled,
}));

describe('TradingSettingsCard', () => {
    const renderTradingSettingsCard = (props: Partial<TradingSettingsCardProps> = {}) =>
        renderWithStoreProvider(<TradingSettingsCard onPress={jest.fn()} {...props} />);

    beforeEach(() => {
        mockIsTradingCountrySet = false;
        mockIsTradingResidenceCheckEnabled = false;
    });

    it('should not render trading settings button when selectIsTradingResidenceCheckEnabled is false', () => {
        const { toJSON } = renderTradingSettingsCard();

        expect(toJSON()).toBeNull();
    });

    describe('when selectIsTradingResidenceCheckEnabled is true', () => {
        beforeEach(() => {
            mockIsTradingResidenceCheckEnabled = true;
        });

        it('should render "Enable trading" button when selectIsTradingCountrySet is false', () => {
            const { getByTestId, getByText } = renderTradingSettingsCard({
                testID: '@settings/trading',
            });

            expect(getByTestId('@settings/trading')).toBeOnTheScreen();
            expect(getByText('Enable trading')).toBeOnTheScreen();
            expect(getByText('Confirm your country of residence')).toBeOnTheScreen();
        });

        it('should render "Trading" button when selectIsTradingCountrySet is true', () => {
            mockIsTradingCountrySet = true;
            const { getByTestId, getByText } = renderTradingSettingsCard({
                testID: '@settings/trading',
            });

            expect(getByTestId('@settings/trading')).toBeOnTheScreen();
            expect(getByText('Trading')).toBeOnTheScreen();
            expect(getByText('Country of residence')).toBeOnTheScreen();
        });
    });
});
