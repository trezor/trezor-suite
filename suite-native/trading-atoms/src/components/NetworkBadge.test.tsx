import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { NetworkBadge } from './NetworkBadge';

describe('NetworkBadge', () => {
    const renderPlatformBadge = async (symbol: NetworkSymbol) =>
        await renderWithBasicProvider(<NetworkBadge symbol={symbol} />);

    it('should render badge with platform name', async () => {
        const { getByLabelText } = await renderPlatformBadge('eth');

        expect(getByLabelText(getTranslation('moduleTrading.networkName'))).toHaveTextContent(
            'Ethereum',
        );
    });
});
