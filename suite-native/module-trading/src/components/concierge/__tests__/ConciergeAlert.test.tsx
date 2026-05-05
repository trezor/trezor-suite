import { type FiatCurrencyCode } from 'invity-api';

import {
    type TradingCountryOption,
    type TradingOTC,
    nonSanctionedRegional,
    useFetchOtc,
} from '@suite-common/trading';
import { useFormContext } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';

import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import {
    CRYPTO_MAX_FORM_TYPE,
    CRYPTO_MIN_FORM_TYPE,
} from '../../../utils/buy/buyFormValidationSchema';
import { ConciergeAlert } from '../ConciergeAlert';

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        useFetchOtc: jest.fn(),
    };
});

type ConciergeFormValues = {
    fiatCurrency: FiatCurrencyCode;
    fiatValue?: string;
    fiatStringAmount?: string;
    country: TradingCountryOption;
    cryptoValue?: string;
};

const mockUseFetchOtc = useFetchOtc as jest.MockedFunction<typeof useFetchOtc>;
const mockUseFormContext = useFormContext as unknown as jest.MockedFunction<
    () => ReturnType<typeof useFormContext<ConciergeFormValues>>
>;

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
} satisfies ConciergeFormValues;

type FormErrors = {
    cryptoValue?: {
        type: string;
    };
};

jest.mock('@suite-native/forms', () => {
    const actual = jest.requireActual('@suite-native/forms');

    return {
        ...actual,
        useFormContext: jest.fn(),
    };
});

const mockConciergeForm = ({
    errors = {},
    values = {},
}: {
    errors?: FormErrors;
    values?: Partial<ConciergeFormValues>;
} = {}) => {
    mockUseFormContext.mockReturnValue({
        getValues: () => ({
            ...defaultFormValues,
            ...values,
        }),
        formState: {
            errors,
        },
    } as unknown as ReturnType<typeof useFormContext<ConciergeFormValues>>);
};

const renderConciergeAlert = ({
    tradingType = 'buy',
    values,
    errors,
}: {
    tradingType?: 'buy' | 'sell';
    values?: Partial<ConciergeFormValues>;
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
