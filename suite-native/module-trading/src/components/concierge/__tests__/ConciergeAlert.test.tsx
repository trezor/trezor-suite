import { type TradingOTC, nonSanctionedRegional, type useFetchOtc } from '@suite-common/trading';
import { type useFormContext } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';

import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import {
    CRYPTO_MAX_FORM_TYPE,
    CRYPTO_MIN_FORM_TYPE,
} from '../../../utils/buy/buyFormValidationSchema';
import { ConciergeAlert, type ConciergeAlertFormValues } from '../ConciergeAlert';

type FormErrors = {
    cryptoValue?: {
        type: string;
    };
};

const mockUseFetchOtc = jest.fn();
jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        useFetchOtc: (...args: any[]) => mockUseFetchOtc(...args),
    };
});

const mockUseFormContext = jest.fn();
jest.mock('@suite-native/forms', () => {
    const actual = jest.requireActual('@suite-native/forms');

    return {
        ...actual,
        useFormContext: (...args: any[]) => mockUseFormContext(...args),
    };
});

const otcData = {
    country: 'CZ',
    minFiatLimits: {
        usd: 1000,
    },
    links: [
        {
            name: 'Trezor OTC',
            url: 'https://trezor.io/',
            allowedCountries: ['CZ'],
        },
    ],
} as TradingOTC;

const defaultFormValues = {
    country: nonSanctionedRegional.getCountryOptionWithWorldwideFallback('CZ'),
    fiatCurrency: 'usd',
    fiatValue: '',
    fiatStringAmount: '',
} satisfies ConciergeAlertFormValues;

const mockConciergeForm = ({
    errors = {},
    values = {},
}: {
    errors?: FormErrors;
    values?: Partial<ConciergeAlertFormValues>;
} = {}) => {
    mockUseFormContext.mockReturnValue({
        getValues: () => ({
            ...defaultFormValues,
            ...values,
        }),
        formState: {
            errors,
        },
    } as unknown as ReturnType<typeof useFormContext<ConciergeAlertFormValues>>);
};

const renderConciergeAlert = ({
    tradingType = 'buy',
    values,
    errors,
}: {
    tradingType?: 'buy' | 'sell';
    values?: Partial<ConciergeAlertFormValues>;
    errors?: FormErrors;
} = {}) => {
    mockConciergeForm({ errors, values });

    return renderWithTradingProvider(<ConciergeAlert tradingType={tradingType} />, {
        tradeType: tradingType,
    });
};

describe('ConciergeAlert', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockUseFetchOtc.mockReturnValue({
            data: otcData,
            isLoading: false,
        } as unknown as ReturnType<typeof useFetchOtc>);
    });

    it('should show alert when fiat amount is equal or over the limit', () => {
        const { getByText } = renderConciergeAlert({
            values: {
                fiatValue: '1000',
            },
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingScreen.concierge.alert.labelBuy')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingScreen.concierge.alert.ctaBuy')),
        ).toBeOnTheScreen();
    });

    it('should show sell alert when fiat string amount is equal or over the limit', () => {
        const { getByText } = renderConciergeAlert({
            tradingType: 'sell',
            values: {
                fiatStringAmount: '1000',
            },
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingScreen.concierge.alert.labelSell')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingScreen.concierge.alert.ctaSell')),
        ).toBeOnTheScreen();
    });

    it('should show alert when CRYPTO_MAX_FORM_TYPE is present in form', () => {
        const { getByText } = renderConciergeAlert({
            errors: {
                cryptoValue: {
                    type: CRYPTO_MAX_FORM_TYPE,
                },
            },
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingScreen.concierge.alert.labelBuy')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingScreen.concierge.alert.ctaBuy')),
        ).toBeOnTheScreen();
    });

    it('should not show alert when CRYPTO_MIN_FORM_TYPE is present in form', () => {
        const { queryByText } = renderConciergeAlert({
            errors: {
                cryptoValue: {
                    type: CRYPTO_MIN_FORM_TYPE,
                },
            },
        });

        expect(
            queryByText(getTranslation('moduleTrading.tradingScreen.concierge.alert.labelBuy')),
        ).not.toBeOnTheScreen();
        expect(
            queryByText(getTranslation('moduleTrading.tradingScreen.concierge.alert.ctaBuy')),
        ).not.toBeOnTheScreen();
    });

    it('should not show alert when fiat amount is under the limit', () => {
        const { queryByText } = renderConciergeAlert({
            values: {
                fiatValue: '999',
            },
        });

        expect(
            queryByText(getTranslation('moduleTrading.tradingScreen.concierge.alert.labelBuy')),
        ).not.toBeOnTheScreen();
        expect(
            queryByText(getTranslation('moduleTrading.tradingScreen.concierge.alert.ctaBuy')),
        ).not.toBeOnTheScreen();
    });
});
