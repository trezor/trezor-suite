import { renderWithBasicProvider } from '@suite-native/test-utils';

import { NetworkSymbolExtendedFormatter } from '../NetworkSymbolExtendedFormatter';

describe('NetworkSymbolExtendedFormatter', () => {
    it('should render symbol uppercase', () => {
        const { getByText } = renderWithBasicProvider(
            <NetworkSymbolExtendedFormatter symbol="btc" />,
        );

        expect(getByText('BTC')).toBeTruthy();
    });
});
