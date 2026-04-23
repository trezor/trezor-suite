import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { ProviderInfoRow, type ProviderInfoRowProps } from '../ProviderInfoRow';

describe('ProviderInfoRow', () => {
    const renderProviderInfoRow = (props: Partial<ProviderInfoRowProps> = {}) => {
        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };

        return renderWithStoreProvider(<ProviderInfoRow exchange="mercuryo" {...props} />, {
            preloadedState,
            providers: ['intl'],
        });
    };

    it('should render provider', () => {
        const { getByText } = renderProviderInfoRow({});

        expect(getByText('Mercuryo')).toBeOnTheScreen();
        expect(getByText('Provider')).toBeOnTheScreen();
    });

    it('should render nothing when no provider is found', () => {
        const { toJSON } = renderProviderInfoRow({ exchange: 'non-existing-provider' });

        expect(toJSON()).toBeNull();
    });
});
