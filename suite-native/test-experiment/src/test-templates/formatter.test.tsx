import { renderHook } from '@testing-library/react-native';

import { FormatterProvider } from '@suite-common/formatters';
import { IntlProviderForTests } from '@suite-native/intl';

const DEFAULT_FORMATTERS_CONFIG = {
    locale: 'en' as const,
    baseCurrency: 'usd' as const,
    bitcoinAmountUnit: 0,
    is24HourFormat: true,
};

const renderHookWithProviders = <Result, Props>(callback: (props: Props) => Result) =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <IntlProviderForTests>
                <FormatterProvider config={DEFAULT_FORMATTERS_CONFIG}>{children}</FormatterProvider>
            </IntlProviderForTests>
        ),
    });

describe('with FormatterProvider', () => {
    it('should render hook', () => {
        const { result } = renderHookWithProviders(() => true);

        expect(result.current).toBe(true);
    });
});
