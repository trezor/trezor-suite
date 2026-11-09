import type { CryptoId } from 'invity-api';

import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider, screen } from '@suite-native/test-utils-store';
import {
    MOCK_ACCOUNT_DEVICE_SESSION_ID,
    ethAsset,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';
import { buyActions, tradingActions } from '@suite-native/trading-state';
import { FirmwareType } from '@trezor/connect';

import { useBuyForm } from './useBuyForm';
import { useBuyFormDefaultAssets } from './useBuyFormDefaultAssets';
import {
    createTradingFeatureFlags,
    createTradingTestStore,
} from '../../test-utils/tradingTestUtils';

const BITCOIN = 'bitcoin' as CryptoId;
const ETHEREUM = 'ethereum' as CryptoId;

const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(),
};

describe('useBuyFormDefaultAssets', () => {
    const renderBuyFormWithDefaults = async (supportedCryptoCurrencies: CryptoId[]) => {
        const tradingState = getInitializedTradingState('buy');
        const store = createTradingTestStore({
            overrides: {
                device: {
                    selectedDevice: {
                        firmwareType: FirmwareType.Universal,
                        state: { staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID },
                    },
                },
                featureFlags: createTradingFeatureFlags(),
                wallet: {
                    trading: {
                        buy: {
                            buyInfo: {
                                ...tradingState.buy.buyInfo!,
                                supportedCryptoCurrencies,
                            },
                        },
                    },
                },
            },
        });

        const rendered = await renderHookWithStoreProvider(
            () => {
                const form = useBuyForm();
                useBuyFormDefaultAssets(form);

                return form;
            },
            { services: { ...services, store } },
        );

        return { ...rendered, store };
    };

    afterEach(async () => {
        await screen.unmount();
    });

    it('should preselect bitcoin and its receive account', async () => {
        const { result } = await renderBuyFormWithDefaults([ETHEREUM, BITCOIN]);

        expect(result.current.getValues('asset')?.cryptoId).toBe('bitcoin');
        expect(result.current.getValues('receiveAccount')?.account.symbol).toBe('btc');
    });

    it('should leave the asset empty when bitcoin cannot be bought', async () => {
        const { result } = await renderBuyFormWithDefaults([ETHEREUM]);

        expect(result.current.getValues('asset')).toBeUndefined();
    });

    it('should replace the selected asset with bitcoin on form reset request', async () => {
        const { result, store } = await renderBuyFormWithDefaults([ETHEREUM, BITCOIN]);

        await act(() => {
            result.current.setValue('asset', ethAsset);
            result.current.setValue('fiatValue', '100');
            store.dispatch(buyActions.assetChanged());
        });

        expect(result.current.getValues('receiveAccount')?.account.symbol).toBe('eth');

        await act(() => {
            store.dispatch(tradingActions.requestTradingFormReset('buy'));
        });

        expect(result.current.getValues('asset')?.cryptoId).toBe('bitcoin');
        expect(result.current.getValues('receiveAccount')?.account.symbol).toBe('btc');
        expect(result.current.getValues('fiatValue')).toBeUndefined();
    });
});
