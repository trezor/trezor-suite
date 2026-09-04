import type { GetSupportedNetworksDep } from '@suite-common/networks';
import { mockGetSupportedNetworks } from '@suite-common/networks/mocks';
import { tradingExchangeActions } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act } from '@suite-native/test-utils';
import { type TestStore, fireEvent, screen, waitFor } from '@suite-native/test-utils-store';
import {
    MOCK_ACCOUNT_DEVICE_SESSION_ID,
    btc1NormalAccount,
    btcAsset,
    eth1NormalAccount,
    eth2legacyAccount,
    ethAsset,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { exchangeActions } from '@suite-native/trading-state';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { FirmwareType } from '@trezor/connect';

import { ExchangeTradeableAssetPicker } from './ExchangeTradeableAssetPicker';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import {
    createTradingLightStore,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

const reportMock = jest.fn();
const services: NativeAnalyticsDep & { networks: GetSupportedNetworksDep } = {
    analytics: mockNativeAnalytics(reportMock),
    networks: { getSupportedNetworks: mockGetSupportedNetworks([btcSymbol, ethSymbol]) },
};

const btc1AccountKey = btc1NormalAccount.key;
const eth1AccountKey = eth1NormalAccount.key;
const eth2AccountKey = eth2legacyAccount.key;
const mockNavigate = jest.fn();
let mockTradingType = 'exchange';
let mockSelectedTradeableAssetCryptoId: string | undefined;
const mockSetParams = jest.fn(
    ({ selectedTradeableAssetCryptoId }: { selectedTradeableAssetCryptoId?: string }) => {
        mockSelectedTradeableAssetCryptoId = selectedTradeableAssetCryptoId;
    },
);

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
        setParams: mockSetParams,
    }),
    useRoute: () => ({
        params: {
            tradingType: mockTradingType,
            selectedTradeableAssetCryptoId: mockSelectedTradeableAssetCryptoId,
        },
    }),
}));

describe('ExchangeTradeableAssetPicker', () => {
    let store: TestStore;
    let form: ExchangeFormType;

    const initPreloadedStore = (firmwareType: FirmwareType) =>
        createTradingLightStore({
            tradeType: 'exchange',
            overrides: {
                device: { selectedDevice: { firmwareType } },
                featureFlags: {
                    ...featureFlagsInitialState,
                },
            },
        });

    // Account preselection needs a device session that the mock accounts belong to,
    // otherwise they are not treated as visible device accounts.
    const initPreloadedStoreWithAccounts = () =>
        createTradingLightStore({
            tradeType: 'exchange',
            overrides: {
                device: {
                    selectedDevice: {
                        firmwareType: FirmwareType.Universal,
                        state: { staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID },
                    },
                },
                featureFlags: {
                    ...featureFlagsInitialState,
                },
            },
        });

    const renderFormHook = async () => {
        const { result } = await renderHookWithTradingProvider(() => useExchangeForm(), {
            services,
            store,
        });

        return result.current;
    };

    const renderTradeableAssetPicker = async () =>
        await renderWithTradingProvider(<ExchangeTradeableAssetPicker />, {
            services,
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        jest.clearAllMocks();
        mockTradingType = 'exchange';
        mockSelectedTradeableAssetCryptoId = undefined;
        store = initPreloadedStore(FirmwareType.Universal);
        form = await renderFormHook();
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('should render "Select asset" button with caret', async () => {
        const { getByLabelText } = await renderTradeableAssetPicker();

        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
        ).toHaveTextContent(
            new RegExp(`^${getTranslation('moduleTrading.selectCoin.buttonTitle')}.$`),
        );
    });

    it('should navigate to the exchange asset screen', async () => {
        const { getByLabelText } = await renderTradeableAssetPicker();

        await fireEvent.press(
            getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
        );

        expect(mockNavigate).toHaveBeenCalledWith('TradingTradeableAsset', {
            tradingType: 'exchange',
        });
    });

    it('should apply receive asset change effects for an asset selected on the screen', async () => {
        mockSelectedTradeableAssetCryptoId = btcAsset.cryptoId;
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        await renderTradeableAssetPicker();

        expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.receiveAssetChanged());
        expect(mockSetParams).toHaveBeenCalledWith({
            selectedTradeableAssetCryptoId: undefined,
        });
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'exchange',
                parameter: 'cryptoTo',
            },
        });
    });

    it('should clear the send asset and its typed amount when it collides with the newly selected receive asset', async () => {
        form.setValue('sendAsset', btcAsset);
        form.setValue('sendCryptoAmount', '1');
        mockSelectedTradeableAssetCryptoId = btcAsset.cryptoId;
        await renderTradeableAssetPicker();

        expect(form.getValues('sendAsset')).toBeUndefined();
        expect(form.getValues('sendCryptoAmount')).toBeUndefined();
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'exchange',
                parameter: 'cryptoFrom',
            },
        });
    });

    describe('receiveAccount preselection', () => {
        beforeEach(async () => {
            jest.clearAllMocks();
            mockSelectedTradeableAssetCryptoId = undefined;
            store = initPreloadedStoreWithAccounts();
            form = await renderFormHook();
        });

        it('should preselect a new receiveAccount for the new asset network after a cross-network change', async () => {
            mockSelectedTradeableAssetCryptoId = btcAsset.cryptoId;
            const result = await renderTradeableAssetPicker();

            await waitFor(() => {
                expect(form.getValues('receiveAccount')).toEqual(
                    expect.objectContaining({
                        account: expect.objectContaining({ key: btc1AccountKey }),
                    }),
                );
            });

            mockSelectedTradeableAssetCryptoId = usdcAsset.cryptoId;
            await result.rerender(<ExchangeTradeableAssetPicker />);

            await waitFor(() => {
                expect(form.getValues('receiveAccount')).toEqual(
                    expect.objectContaining({
                        account: expect.objectContaining({ key: eth1AccountKey }),
                    }),
                );
            });
        });

        it('should keep the selected receiveAccount when switching to another asset on the same network', async () => {
            mockSelectedTradeableAssetCryptoId = ethAsset.cryptoId;
            const result = await renderTradeableAssetPicker();

            await waitFor(() => {
                expect(form.getValues('receiveAccount')).toEqual(
                    expect.objectContaining({
                        account: expect.objectContaining({ key: eth1AccountKey }),
                    }),
                );
            });

            await act(() => {
                store.dispatch(tradingExchangeActions.setReceiveAccountKey(eth2AccountKey));
            });

            await waitFor(() => {
                expect(form.getValues('receiveAccount')).toEqual(
                    expect.objectContaining({
                        account: expect.objectContaining({ key: eth2AccountKey }),
                    }),
                );
            });

            mockSelectedTradeableAssetCryptoId = usdcAsset.cryptoId;
            await result.rerender(<ExchangeTradeableAssetPicker />);

            await waitFor(() => {
                expect(form.getValues('receiveAccount')).toEqual(
                    expect.objectContaining({
                        account: expect.objectContaining({ key: eth2AccountKey }),
                    }),
                );
            });
        });
    });
});
