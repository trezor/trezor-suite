import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { tradingBuyActions } from '@suite-common/trading';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act } from '@suite-native/test-utils';
import { type TestStore, fireEvent, screen, waitFor } from '@suite-native/test-utils-store';
import {
    MOCK_ACCOUNT_DEVICE_SESSION_ID,
    eth1NormalAccount,
    eth2legacyAccount,
    ethAsset,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { buyActions } from '@suite-native/trading-state';
import { type BuyFormType } from '@suite-native/trading-types';
import { FirmwareType } from '@trezor/connect';

import { BuyTradeableAssetPicker } from './BuyTradeableAssetPicker';
import { useBuyForm } from '../../hooks/buy/useBuyForm';
import {
    createTradingLightStore,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

const reportMock = jest.fn();
const services: NativeAnalyticsDep & NetworkModuleRepositoryDep = {
    analytics: mockNativeAnalytics(reportMock),
    networkModuleRepository: {
        ...mockNetworkModuleRepository(),
        getSupportedNetworks: () => ['btc', 'eth'],
    },
};

const eth1AccountKey = eth1NormalAccount.key;
const eth2AccountKey = eth2legacyAccount.key;
const mockNavigate = jest.fn();
let mockTradingType = 'buy';
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

describe('BuyTradeableAssetPicker', () => {
    let store: TestStore;
    let form: BuyFormType;

    const initPreloadedStore = (firmwareType: FirmwareType) =>
        createTradingLightStore({
            tradeType: 'buy',
            overrides: {
                device: { selectedDevice: { firmwareType } },
            },
        });

    // Account preselection needs a device session that the mock accounts belong to,
    // otherwise they are not treated as visible device accounts.
    const initPreloadedStoreWithAccounts = () =>
        createTradingLightStore({
            tradeType: 'buy',
            overrides: {
                device: {
                    selectedDevice: {
                        firmwareType: FirmwareType.Universal,
                        state: { staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID },
                    },
                },
            },
        });

    const renderFormHook = async () => {
        const { result } = await renderHookWithTradingProvider(() => useBuyForm(), {
            services,
            store,
        });

        return result.current;
    };

    const renderTradeableAssetPicker = async () => {
        const res = await renderWithTradingProvider(
            <Form form={form}>
                <BuyTradeableAssetPicker />
            </Form>,
            { services, store },
        );
        await act(async () => {
            await act(() => Promise.resolve());
        });

        return res;
    };

    afterEach(async () => {
        await screen.unmount();
    });

    describe('with regular firmware', () => {
        beforeEach(async () => {
            jest.clearAllMocks();
            mockTradingType = 'buy';
            mockSelectedTradeableAssetCryptoId = undefined;
            store = initPreloadedStore(FirmwareType.Universal);
            form = await renderFormHook();
        });

        it('should render "Select asset" button with caret', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            expect(
                getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
            ).toHaveTextContent(
                new RegExp(`^${getTranslation('moduleTrading.selectCoin.buttonTitle')}.$`),
            );
        });

        it('should navigate to the buy asset screen', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            await fireEvent.press(
                getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
            );

            expect(mockNavigate).toHaveBeenCalledWith('TradingTradeableAsset', {
                tradingType: 'buy',
            });
        });

        it('should apply buy asset change effects for an asset selected on the screen', async () => {
            form.setValue('cryptoValue', '0.1');
            mockSelectedTradeableAssetCryptoId = 'bitcoin';
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            await renderTradeableAssetPicker();

            expect(form.getValues('cryptoValue')).toBeUndefined();
            expect(dispatchSpy).toHaveBeenCalledWith(buyActions.assetChanged());
            expect(mockSetParams).toHaveBeenCalledWith({
                selectedTradeableAssetCryptoId: undefined,
            });
            expect(reportMock).toHaveBeenCalledWith({
                type: events.tradingParameterChangedEvent.name,
                payload: {
                    type: 'buy',
                    parameter: 'cryptoTo',
                },
            });
        });

        it('should not apply an asset returned from another trading flow', async () => {
            mockTradingType = 'exchange';
            mockSelectedTradeableAssetCryptoId = 'bitcoin';
            await renderTradeableAssetPicker();

            expect(form.getValues('asset')).toBeUndefined();
            expect(mockSetParams).not.toHaveBeenCalled();
        });

        it('should dispatch assetTokenChanged when switching between assets on the same network', async () => {
            form.setValue('asset', ethAsset);
            form.setValue('cryptoValue', '0.1');
            mockSelectedTradeableAssetCryptoId = usdcAsset.cryptoId;
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            await renderTradeableAssetPicker();

            expect(form.getValues('cryptoValue')).toBeUndefined();
            expect(dispatchSpy).toHaveBeenCalledWith(buyActions.assetTokenChanged());
            expect(dispatchSpy).not.toHaveBeenCalledWith(buyActions.assetChanged());
            expect(reportMock).toHaveBeenCalledWith({
                type: events.tradingParameterChangedEvent.name,
                payload: {
                    type: 'buy',
                    parameter: 'cryptoTo',
                },
            });
        });
    });

    describe('receiveAccount preselection', () => {
        beforeEach(async () => {
            jest.clearAllMocks();
            mockTradingType = 'buy';
            mockSelectedTradeableAssetCryptoId = undefined;
            store = initPreloadedStoreWithAccounts();
            form = await renderFormHook();
        });

        it('should keep the selected receiveAccount when switching to another asset on the same network', async () => {
            form.setValue('asset', ethAsset);
            const result = await renderTradeableAssetPicker();

            await waitFor(() => {
                expect(form.getValues('receiveAccount')).toEqual({
                    account: expect.objectContaining({ key: eth1AccountKey }),
                });
            });

            await act(() => {
                store.dispatch(tradingBuyActions.setTradingAccountKey(eth2AccountKey));
                store.dispatch(tradingBuyActions.setReceiveAccountKey(eth2AccountKey));
            });

            await waitFor(() => {
                expect(form.getValues('receiveAccount')).toEqual({
                    account: expect.objectContaining({ key: eth2AccountKey }),
                });
            });

            mockSelectedTradeableAssetCryptoId = usdcAsset.cryptoId;
            await result.rerender(
                <Form form={form}>
                    <BuyTradeableAssetPicker />
                </Form>,
            );

            await waitFor(() => {
                expect(form.getValues('receiveAccount')).toEqual({
                    account: expect.objectContaining({ key: eth2AccountKey }),
                });
            });
        });
    });

    describe('with BTC-only firmware', () => {
        beforeEach(async () => {
            jest.clearAllMocks();
            mockTradingType = 'buy';
            mockSelectedTradeableAssetCryptoId = undefined;
            store = initPreloadedStore(FirmwareType.BitcoinOnly);
            form = await renderFormHook();
        });

        it('should preselect BTC and do not render caret', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            expect(
                getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
            ).toHaveTextContent('BTC');
        });

        it('should do nothing on button or input press', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            // no need to act as there should be no action
            await fireEvent.press(
                getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
            );
            await fireEvent.press(
                getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
            );

            expect(
                getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
            ).toHaveTextContent('BTC');
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});
