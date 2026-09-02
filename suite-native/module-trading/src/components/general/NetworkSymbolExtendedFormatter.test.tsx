import { renderWithBasicProvider } from '@suite-native/test-utils';

import { NetworkSymbolExtendedFormatter } from './NetworkSymbolExtendedFormatter';

describe('NetworkSymbolExtendedFormatter', () => {
    it('should render symbol uppercase', async () => {
        const { getByText } = await renderWithBasicProvider(
            <NetworkSymbolExtendedFormatter symbol="btc" />,
        );

        expect(getByText('BTC')).toBeTruthy();
    });
});
