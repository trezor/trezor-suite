import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { FaqCard } from './FaqCard';

let mockIsAndroid: boolean;
let mockIsTradingEnabled: boolean;

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isAndroid: () => mockIsAndroid,
}));

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingEnabled: () => mockIsTradingEnabled,
}));

const defaultPreloadedState = {
    device: { selectedDevice: undefined, devices: [] },
};

describe('FaqCard', () => {
    const renderFaqCard = async (preloadedState = {}) =>
        await renderWithStoreProvider(<FaqCard />, {
            preloadedState: { ...defaultPreloadedState, ...preloadedState },
        });

    beforeEach(() => {
        mockIsTradingEnabled = true;
    });

    describe('on Android', () => {
        beforeEach(() => {
            mockIsAndroid = true;
        });

        it('should render appropriate sections when BT is enabled', async () => {
            const { getByText } = await renderFaqCard();

            // Android BT-specific info
            expect(
                getByText(
                    getTranslation(
                        'moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.title',
                    ),
                ),
            ).toBeOnTheScreen();

            // Trading info
            expect(
                getByText(getTranslation('moduleSettings.faq.trading.question')),
            ).toBeOnTheScreen();
        });

        it('should not render trading section when trading is disabled', async () => {
            mockIsTradingEnabled = false;

            const { queryByText } = await renderFaqCard();

            expect(queryByText(getTranslation('moduleSettings.faq.trading.question'))).toBeNull();
        });
    });

    describe('on iOS', () => {
        beforeEach(() => {
            mockIsAndroid = false;
        });

        it('should render appropriate sections when BT is enabled', async () => {
            const { getByText } = await renderFaqCard();

            // iOS BT-specific info
            expect(
                getByText(getTranslation('moduleSettings.faq.bluetoothEnabled.ios.0.question')),
            ).toBeOnTheScreen();

            // Trading info
            expect(
                getByText(getTranslation('moduleSettings.faq.trading.question')),
            ).toBeOnTheScreen();
        });

        it('should not render trading section when trading is disabled', async () => {
            mockIsTradingEnabled = false;

            const { queryByText } = await renderFaqCard();

            expect(queryByText(getTranslation('moduleSettings.faq.trading.question'))).toBeNull();
        });
    });
});
