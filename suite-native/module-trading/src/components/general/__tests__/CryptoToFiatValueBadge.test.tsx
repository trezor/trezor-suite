import { NetworkSymbol } from '@suite-common/wallet-config';
import { Rate, Timestamp, WalletSettings } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { FullAppState } from '@suite-native/state';
import { PreloadedState, act, renderWithStoreProvider } from '@suite-native/test-utils';
import { btcAsset, ethAsset } from '@suite-native/trading-fixtures';
import { PROTO } from '@trezor/connect';

import { CryptoToFiatValueBadge, CryptoToFiatValueBadgeProps } from '../CryptoToFiatValueBadge';

jest.mock('@suite-common/fiat-services', () => ({
    ...jest.requireActual('@suite-common/fiat-services'),
    fetchCurrentFiatRates: () => Promise.resolve(null),
}));

describe('CryptoToFiatValueBadge', () => {
    const createMockRate = (rate: number, symbol: NetworkSymbol): Rate => ({
        rate,
        lastTickerTimestamp: 1000000 as Timestamp,
        lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
        isLoading: false,
        error: null,
        ticker: { symbol },
    });

    const getPreloadedState = (
        walletOverrides: Partial<FullAppState['wallet']> = {},
    ): Partial<FullAppState> => ({
        wallet: {
            settings: {
                localCurrency: 'usd',
                bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
            } as WalletSettings,
            fiat: {
                current: {
                    [getFiatRateKey('btc', 'usd')]: createMockRate(50000, 'btc'),
                },
                lastWeek: {},
                historic: {},
            },
            ...walletOverrides,
        } as FullAppState['wallet'],
    });

    const renderCryptoToFiatValueBadge = async (
        props: CryptoToFiatValueBadgeProps,
        preloadedState: PreloadedState = {},
    ) => {
        const res = renderWithStoreProvider(<CryptoToFiatValueBadge {...props} />, {
            preloadedState,
        });

        // await mocked loading of rates
        await act(() => Promise.resolve());

        return res;
    };

    it('should render nothing when no rate is loaded', async () => {
        const { toJSON } = await renderCryptoToFiatValueBadge(
            { amount: '1', cryptoId: ethAsset.cryptoId },
            getPreloadedState(),
        );

        expect(toJSON()).toBeNull();
    });

    it.each([undefined, ''])(
        'should render nothing when cryptoValue is [%s]',
        async cryptoValue => {
            const { toJSON } = await renderCryptoToFiatValueBadge(
                { amount: cryptoValue, cryptoId: btcAsset.cryptoId },

                getPreloadedState(),
            );

            expect(toJSON()).toBeNull();
        },
    );

    it('should render rate for 0', async () => {
        const { getByText } = await renderCryptoToFiatValueBadge(
            { amount: '0', cryptoId: btcAsset.cryptoId },
            getPreloadedState(),
        );

        expect(getByText('$0.00')).toBeOnTheScreen();
    });

    it('should render rate otherwise', async () => {
        const { getByText } = await renderCryptoToFiatValueBadge(
            { amount: '1', cryptoId: btcAsset.cryptoId },
            getPreloadedState(),
        );

        expect(getByText('$50,000.00')).toBeOnTheScreen();
    });

    it('should render prefix, if specified', async () => {
        const { getByText } = await renderCryptoToFiatValueBadge(
            { amount: '1', cryptoId: btcAsset.cryptoId, prefix: ':fire: ' },
            getPreloadedState(),
        );

        expect(getByText(':fire: $50,000.00')).toBeOnTheScreen();
    });

    it('should not render prefix when no value is rendered ', async () => {
        const { toJSON } = await renderCryptoToFiatValueBadge(
            { amount: '1', cryptoId: ethAsset.cryptoId, prefix: ':sweat_drops: ' },
            getPreloadedState(),
        );

        expect(toJSON()).toBeNull();
    });
});
