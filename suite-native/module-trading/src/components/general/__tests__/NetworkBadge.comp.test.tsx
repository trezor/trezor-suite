import { CryptoId } from 'invity-api';

import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import coins from '../../../__fixtures__/coins.json';
import platforms from '../../../__fixtures__/platforms.json';
import { NetworkBadge } from '../NetworkBadge';

describe('NetworkBadge', () => {
    const renderPlatformBadge = (cryptoId: CryptoId) =>
        renderWithStoreProviderAsync(<NetworkBadge cryptoId={cryptoId} />, {
            preloadedState: {
                wallet: { tradingNew: { info: { coins, platforms } } },
            },
        });

    it('should render badge with platform name', async () => {
        const { getByLabelText } = await renderPlatformBadge(
            'ethereum--0x07150e919b4de5fd6a63de1f9384828396f25fdc' as CryptoId,
        );

        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
    });
});
