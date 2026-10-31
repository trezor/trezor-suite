import type { CryptoId } from 'invity-api';

import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { mockNetworkIcon, mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { AlertRenderer } from '@suite-native/alerts';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form, useForm, yup } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act, fireEvent, screen, waitFor } from '@suite-native/test-utils-store';
import { btcAsset, ethAsset, ethOnBaseAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormValues, type TradeableAsset } from '@suite-native/trading-types';

import { ExchangeAssetsSwitchButton } from './ExchangeAssetsSwitchButton';
import {
    createTradingTestStore,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const btcAccount = mockWalletAccount({
    symbol: btcSymbol,
    descriptor: asAccountDescriptor('btcAccount'),
});
const ethAccount = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('ethAccount'),
});

const services: NativeAnalyticsDep & { networks: NetworkModuleRepositoryDep } = {
    analytics: mockNativeAnalytics(),
    networks: { networkModuleRepository: mockNetworkModuleRepository() },
};

type FormValues = Partial<
    Pick<ExchangeFormValues, 'sendAsset' | 'sendAccount' | 'receiveAsset' | 'receiveAccount'>
>;

const SWITCHABLE_VALUES: FormValues = {
    sendAsset: btcAsset,
    sendAccount: btcAccount,
    receiveAsset: ethAsset,
    receiveAccount: { account: ethAccount },
};

type RenderSwitchButtonParams = {
    values?: FormValues;
    enabledNetworks?: NetworkSymbol[];
    sellCryptoIds?: CryptoId[];
};

const renderSwitchButton = async ({
    values = SWITCHABLE_VALUES,
    enabledNetworks = [btcSymbol, ethSymbol],
    sellCryptoIds,
}: RenderSwitchButtonParams = {}) => {
    const store = createTradingTestStore({
        tradeType: 'exchange',
        overrides: {
            wallet: {
                settings: { enabledNetworks },
                ...(sellCryptoIds && {
                    trading: { exchange: { exchangeInfo: { sellCryptoIds } } },
                }),
            },
        },
    });
    const storeServices = {
        ...services,
        networks: { networkIcon: mockNetworkIcon(), ...services.networks },
        store,
    };

    const { result } = await renderHookWithTradingProvider(
        () => useForm<ExchangeFormValues>({ validation: yup.object({}) }),
        { services: storeServices },
    );
    const form = result.current;

    await act(() => {
        form.setValue('sendAsset', values.sendAsset);
        form.setValue('sendAccount', values.sendAccount);
        form.setValue('receiveAsset', values.receiveAsset);
        form.setValue('receiveAccount', values.receiveAccount);
    });

    await renderWithTradingProvider(<ExchangeAssetsSwitchButton />, {
        services: storeServices,
        wrapper: ({ children }) => (
            <Form form={form}>
                {children}
                <AlertRenderer />
            </Form>
        ),
    });

    const button = screen.getByTestId('@trading/exchange/switch-assets');

    return { form, button };
};

const inactiveNetworkAlertTitle = getTranslation(
    'moduleTrading.assetSwitcher.inactiveNetworkAlert.title',
);

describe('ExchangeAssetsSwitchButton', () => {
    afterEach(async () => {
        await screen.unmount();
    });

    it('is disabled without a receive asset', async () => {
        const { button } = await renderSwitchButton({
            values: { ...SWITCHABLE_VALUES, receiveAsset: undefined },
        });

        expect(button).toBeDisabled();
    });

    it('switches the assets on press', async () => {
        const { form, button } = await renderSwitchButton();

        await fireEvent.press(button);

        await waitFor(() => {
            expect(form.getValues('sendAsset')).toEqual(ethAsset);
            expect(form.getValues('receiveAsset')).toEqual(btcAsset);
        });
        expect(screen.queryByText(inactiveNetworkAlertTitle)).toBeNull();
    });

    it.each<[string, TradeableAsset, string]>([
        ['a coin', ethAsset, 'Ethereum'],
        ['an asset on a platform', ethOnBaseAsset, 'Base'],
    ])(
        'leaves the pay side empty and explains the inactive network of %s',
        async (_, receiveAsset, network) => {
            const { form, button } = await renderSwitchButton({
                values: { ...SWITCHABLE_VALUES, receiveAsset, receiveAccount: undefined },
                enabledNetworks: [btcSymbol],
                sellCryptoIds: [btcAsset.cryptoId, receiveAsset.cryptoId],
            });

            await fireEvent.press(button);

            await waitFor(() => {
                expect(form.getValues('receiveAsset')).toEqual(btcAsset);
                expect(form.getValues('sendAsset')).toBeUndefined();
            });
            expect(screen.getByText(inactiveNetworkAlertTitle)).toBeOnTheScreen();
            expect(
                screen.getByText(
                    getTranslation('moduleTrading.assetSwitcher.inactiveNetworkAlert.description', {
                        asset: receiveAsset.symbol,
                        network,
                    }),
                ),
            ).toBeOnTheScreen();

            await fireEvent.press(screen.getByText(getTranslation('generic.buttons.gotIt')));

            await waitFor(() => {
                expect(screen.queryByText(inactiveNetworkAlertTitle)).toBeNull();
            });
        },
    );
});
