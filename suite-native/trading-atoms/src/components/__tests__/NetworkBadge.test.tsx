import { type NetworkSymbol } from '@suite-common/wallet-config';
import { renderWithProviders } from '@suite-native/test-utils';

import { NetworkBadge } from '../NetworkBadge';

describe('NetworkBadge', () => {
    const renderPlatformBadge = (symbol: NetworkSymbol) =>
        renderWithProviders(<NetworkBadge symbol={symbol} />, { providers: ['intl'] });

    it('should render badge with platform name', () => {
        const { getByLabelText } = renderPlatformBadge('eth');

        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
    });
});
