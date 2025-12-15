import { type NetworkSymbol } from '@suite-common/wallet-config';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { NetworkBadge } from '../NetworkBadge';

describe('NetworkBadge', () => {
    const renderPlatformBadge = (symbol: NetworkSymbol) =>
        renderWithBasicProvider(<NetworkBadge symbol={symbol} />);

    it('should render badge with platform name', () => {
        const { getByLabelText } = renderPlatformBadge('eth');

        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
    });
});
