import type { CryptoId } from 'invity-api';

import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { renderHookWithStoreProvider, screen } from '@suite-native/test-utils-store';
import {
    MOCK_ACCOUNT_DEVICE_SESSION_ID,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';
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

        return await renderHookWithStoreProvider(
            () => {
                const form = useBuyForm();
                useBuyFormDefaultAssets(form);

                return form;
            },
            { services: { ...services, store } },
        );
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
});
