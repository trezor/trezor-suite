import { CryptoId } from 'invity-api';

import { renderWithStore, waitFor } from '@suite-native/test-utils';

import coins from '../../../__fixtures__/coins.json';
import platforms from '../../../__fixtures__/platforms.json';
import { NetworkBadge } from '../NetworkBadge';

describe('NetworkBadge', () => {
    const renderPlatformBadge = async (cryptoId: CryptoId) => {
        const result = renderWithStore(<NetworkBadge cryptoId={cryptoId} />, {
            preloadedState: {
                wallet: { tradingNew: { info: { coins, platforms } } },
            },
        });

        await waitFor(() => {
            expect(result.toJSON()).not.toBeNull();
        });

        return result;
    };

    it('should render badge with platform name', async () => {
        const { getByLabelText } = await renderPlatformBadge(
            'ethereum--0x07150e919b4de5fd6a63de1f9384828396f25fdc' as CryptoId,
        );

        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
    });
});
