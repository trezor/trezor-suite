import { type TradingOTC, useFetchOtc } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, screen, userEvent, waitFor } from '@suite-native/test-utils-store';
import { residenceCheckDisabledState } from '@suite-native/trading-fixtures';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { ConciergeTabContent } from '../ConciergeTabContent';

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        useFetchOtc: jest.fn(),
    };
});

const mockUseFetchOtc = useFetchOtc as jest.MockedFunction<typeof useFetchOtc>;

const otcData = {
    country: 'CZ',
    minFiatLimits: {} as TradingOTC['minFiatLimits'],
    links: [
        {
            name: 'Alpha OTC',
            url: 'https://alpha.example.com',
            allowedCountries: ['CZ'],
        },
        {
            name: 'US OTC',
            url: 'https://us.example.com',
            allowedCountries: ['US'],
        },
    ],
} as TradingOTC;

const renderConciergeTabContent = (
    overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
) =>
    renderWithTradingProvider(<ConciergeTabContent />, {
        overrides: {
            ...residenceCheckDisabledState,
            ...overrides,
        },
    });

describe('ConciergeTabContent', () => {
    beforeEach(() => {
        mockUseFetchOtc.mockReturnValue({
            data: otcData,
            isLoading: false,
        } as unknown as ReturnType<typeof useFetchOtc>);
    });

    it('should use OTC country as form default when saved residence country is not set', () => {
        renderConciergeTabContent();

        expect(
            screen.getByText(
                getTranslation('tradingResidence.locationSettings.countryOfResidence'),
            ),
        ).toBeOnTheScreen();
        expect(screen.getByTestId('@trading/concierge/country/value')).toHaveTextContent('CZE');
    });

    it('should prefer saved residence country over OTC country', () => {
        renderConciergeTabContent({
            wallet: {
                trading: {
                    residence: {
                        country: 'US',
                    },
                },
            },
        });

        expect(screen.getByTestId('@trading/concierge/country/value')).toHaveTextContent('USA');
    });

    it('should filter providers by form country', () => {
        const { getAllByText, getByText, queryByText } = renderConciergeTabContent({
            wallet: {
                trading: {
                    residence: {
                        country: 'US',
                    },
                },
            },
        });

        fireEvent.press(getByText(getTranslation('moduleTrading.tradingScreen.provider')));

        expect(getAllByText('US OTC').length).toBeGreaterThan(0);
        expect(queryByText('Alpha OTC')).toBeNull();
    });

    it('should clear selected provider when country changes', async () => {
        const { getByText, queryByText } = renderConciergeTabContent({
            wallet: {
                trading: {
                    residence: {
                        country: 'CZ',
                    },
                },
            },
        });

        expect(getByText(getTranslation('generic.buttons.continue'))).toBeOnTheScreen();

        await userEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.countryOfResidence')),
        );
        await userEvent.press(getByText('Albania'));

        await waitFor(() => {
            expect(queryByText(getTranslation('generic.buttons.continue'))).toBeNull();
        });
    });
});
