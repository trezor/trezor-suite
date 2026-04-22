import { renderWithProviders } from '@suite-native/test-utils';

import { NetworkSymbolExtendedFormatter } from '../NetworkSymbolExtendedFormatter';

describe('NetworkSymbolExtendedFormatter', () => {
    it('should render symbol uppercase', () => {
        const { getByText } = renderWithProviders(<NetworkSymbolExtendedFormatter symbol="btc" />, {
            providers: ['intl'],
        });

        expect(getByText('BTC')).toBeTruthy();
    });
});
