// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { ProviderInfoRow, ProviderInfoRowProps } from '../ProviderInfoRow';

describe('ProviderInfoRow', () => {
    const renderProviderInfoRow = (props: Partial<ProviderInfoRowProps> = {}) => {
        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };

        return renderWithStoreProviderAsync(<ProviderInfoRow exchange="mercuryo" {...props} />, {
            preloadedState,
        });
    };

    it('should render provider', async () => {
        const { getByText } = await renderProviderInfoRow({});

        expect(getByText('Mercuryo')).toBeOnTheScreen();
        expect(getByText('Provider')).toBeOnTheScreen();
    });

    it('should render nothing when no provider is found', async () => {
        const { toJSON } = await renderProviderInfoRow({ exchange: 'non-existing-provider' });

        expect(toJSON()).toBeNull();
    });
});
