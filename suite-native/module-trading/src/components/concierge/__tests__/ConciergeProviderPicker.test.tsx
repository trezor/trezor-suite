import {
    type TradingCountryCode,
    type TradingOTC,
    nonSanctionedRegional,
    useFetchOtc,
} from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import { Form, useForm } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';
import { type ConciergeFormValues } from '@suite-native/trading-types';

import { ConciergeProviderPicker } from '../ConciergeProviderPicker';

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
            name: 'Trezor OTC',
            url: 'https://trezor.io/',
            allowedCountries: ['CZ'],
        },
        {
            name: 'Invity OTC',
            url: 'https://invity.io',
            allowedCountries: ['CZ'],
        },
    ],
} as TradingOTC;

const ConciergeProviderPickerWrapper = ({ country = 'CZ' }: { country?: TradingCountryCode }) => {
    const form = useForm<ConciergeFormValues>({
        defaultValues: {
            country: nonSanctionedRegional.getCountryOptionWithWorldwideFallback(country),
        },
        validation: yup.object({}),
    });

    return (
        <Form form={form}>
            <ConciergeProviderPicker />
        </Form>
    );
};

const renderConciergeProviderPicker = (props?: { country?: TradingCountryCode }) => {
    mockUseFetchOtc.mockReturnValue({
        data: otcData,
        isLoading: false,
    } as unknown as ReturnType<typeof useFetchOtc>);

    return renderWithBasicProvider(<ConciergeProviderPickerWrapper country={props?.country} />);
};

describe('ConciergeProviderPicker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should select first provider by default', () => {
        const { getByTestId } = renderConciergeProviderPicker();

        expect(getByTestId('@trading/concierge/provider-picker/value')).toHaveTextContent(
            'Trezor OTC',
        );
    });

    it('should open sheet and select Invity OTC', () => {
        const { getByTestId, getByText } = renderConciergeProviderPicker();

        fireEvent.press(getByTestId('@trading/concierge/provider-picker'));
        fireEvent.press(getByText('Invity OTC'));

        expect(getByTestId('@trading/concierge/provider-picker/value')).toHaveTextContent(
            'Invity OTC',
        );
    });

    it('should show warning when no providers are available', () => {
        const { getByText } = renderConciergeProviderPicker({ country: 'US' });

        expect(
            getByText(getTranslation('moduleTrading.tradingScreen.concierge.noProvidersAvailable')),
        ).toBeOnTheScreen();
    });
});
