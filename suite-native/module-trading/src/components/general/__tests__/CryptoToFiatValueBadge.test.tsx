import { act, renderWithStoreProvider } from '@suite-native/test-utils';
import { btcAsset, ethAsset, mockWalletFiatRatesAndSettings } from '@suite-native/trading-fixtures';

import { CryptoToFiatValueBadge, CryptoToFiatValueBadgeProps } from '../CryptoToFiatValueBadge';

jest.mock('@suite-common/fiat-services', () => ({
    ...jest.requireActual('@suite-common/fiat-services'),
    fetchCurrentFiatRates: () => Promise.resolve(null),
}));

describe('CryptoToFiatValueBadge', () => {
    const getPreloadedState = () => ({
        wallet: mockWalletFiatRatesAndSettings(),
    });

    const renderCryptoToFiatValueBadge = async (props: CryptoToFiatValueBadgeProps) => {
        const res = renderWithStoreProvider(<CryptoToFiatValueBadge {...props} />, {
            preloadedState: getPreloadedState(),
        });

        // await mocked loading of rates
        await act(() => Promise.resolve());

        return res;
    };

    it('should render nothing when no rate is loaded', async () => {
        const { toJSON } = await renderCryptoToFiatValueBadge({
            amount: '1',
            cryptoId: ethAsset.cryptoId,
        });

        expect(toJSON()).toBeNull();
    });

    it.each([undefined, ''])(
        'should render nothing when cryptoValue is [%s]',
        async cryptoValue => {
            const { toJSON } = await renderCryptoToFiatValueBadge({
                amount: cryptoValue,
                cryptoId: btcAsset.cryptoId,
            });

            expect(toJSON()).toBeNull();
        },
    );

    it('should render rate for 0', async () => {
        const { getByText } = await renderCryptoToFiatValueBadge({
            amount: '0',
            cryptoId: btcAsset.cryptoId,
        });

        expect(getByText('$0.00')).toBeOnTheScreen();
    });

    it('should render rate otherwise', async () => {
        const { getByText } = await renderCryptoToFiatValueBadge({
            amount: '1',
            cryptoId: btcAsset.cryptoId,
        });

        expect(getByText('$50,000.00')).toBeOnTheScreen();
    });

    it('should render prefix, if specified', async () => {
        const { getByText } = await renderCryptoToFiatValueBadge({
            amount: '1',
            cryptoId: btcAsset.cryptoId,
            prefix: ':fire: ',
        });

        expect(getByText(':fire: $50,000.00')).toBeOnTheScreen();
    });

    it('should not render prefix when no value is rendered ', async () => {
        const { toJSON } = await renderCryptoToFiatValueBadge({
            amount: '1',
            cryptoId: ethAsset.cryptoId,
            prefix: ':sweat_drops: ',
        });

        expect(toJSON()).toBeNull();
    });
});
