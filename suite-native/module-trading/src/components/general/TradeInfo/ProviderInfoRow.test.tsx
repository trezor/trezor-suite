import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { ProviderInfoRow, type ProviderInfoRowProps } from './ProviderInfoRow';

describe('ProviderInfoRow', () => {
    const renderProviderInfoRow = async (props: Partial<ProviderInfoRowProps> = {}) => {
        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };

        return await renderWithStoreProvider(
            <ProviderInfoRow exchange="mercuryo" tradingType="exchange" {...props} />,
            {
                preloadedState,
            },
        );
    };

    it('should render provider', async () => {
        const { getByText } = await renderProviderInfoRow({});

        expect(getByText('Mercuryo')).toBeOnTheScreen();
        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
    });

    it('should render nothing when no provider is found', async () => {
        const { toJSON } = await renderProviderInfoRow({ exchange: 'non-existing-provider' });

        expect(toJSON()).toBeNull();
    });
});
