import { NetworkSymbol } from '@suite-common/wallet-config';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import coins from '../../../__fixtures__/coins.json';
import platforms from '../../../__fixtures__/platforms.json';
import { NetworkBadge } from '../NetworkBadge';

describe('NetworkBadge', () => {
    const renderPlatformBadge = (symbol: NetworkSymbol) =>
        renderWithStoreProviderAsync(<NetworkBadge symbol={symbol} />, {
            preloadedState: {
                wallet: { tradingNew: { info: { coins, platforms } } },
            },
        });

    it('should render badge with platform name', async () => {
        const { getByLabelText } = await renderPlatformBadge('eth');

        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
    });
});
