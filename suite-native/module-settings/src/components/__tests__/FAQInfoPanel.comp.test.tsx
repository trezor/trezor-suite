import { FeatureFlag } from '@suite-native/feature-flags';
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { FAQInfoPanel } from '../FAQInfoPanel';

let mockIsAndroid: boolean;
let mockIsTradingEnabled: boolean;

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isAndroid: () => mockIsAndroid,
}));

jest.mock('@suite-native/module-trading', () => ({
    ...jest.requireActual('@suite-native/module-trading'),
    selectIsTradingEnabled: () => mockIsTradingEnabled,
}));

describe('FAQInfoPanel', () => {
    const renderFAQInfoPanel = (preloadedState: PreloadedState = {}) =>
        renderWithStoreProviderAsync(<FAQInfoPanel />, { preloadedState });

    beforeEach(() => {
        mockIsTradingEnabled = true;
    });

    describe('on Android', () => {
        beforeEach(() => {
            mockIsAndroid = true;
        });

        it('should render appropriate sections when BT is enabled', async () => {
            const { getByText } = await renderFAQInfoPanel({
                featureFlags: {
                    [FeatureFlag.IsBluetoothEnabled]: true,
                },
            });

            // Android BT-specific info
            expect(getByText('For wireless connections:')).toBeOnTheScreen();

            // Trading info
            expect(getByText('What trading features are available?')).toBeOnTheScreen();
        });

        it('should not render BT section when BT is disabled by FF', async () => {
            const { queryByText } = await renderFAQInfoPanel({
                featureFlags: {
                    [FeatureFlag.IsBluetoothEnabled]: false,
                },
            });

            // Android BT-specific info
            expect(queryByText('For wireless connections:')).toBeNull();
        });

        it('should not render trading section when trading is disabled', async () => {
            mockIsTradingEnabled = false;

            const { queryByText } = await renderFAQInfoPanel({
                featureFlags: {
                    [FeatureFlag.IsBluetoothEnabled]: true,
                },
            });

            expect(queryByText('What trading features are available?')).toBeNull();
        });
    });

    describe('on iOS', () => {
        beforeEach(() => {
            mockIsAndroid = false;
        });

        it('should render appropriate sections when BT is enabled', async () => {
            const { getByText } = await renderFAQInfoPanel({
                featureFlags: {
                    [FeatureFlag.IsBluetoothEnabled]: true,
                },
            });

            // iOS BT-specific info
            expect(
                getByText('Can I connect my Trezor to Trezor Suite on Mobile?'),
            ).toBeOnTheScreen();

            // Trading info
            expect(getByText('What trading features are available?')).toBeOnTheScreen();
        });

        it('should not render BT section when BT is disabled by FF', async () => {
            const { queryByText } = await renderFAQInfoPanel({
                featureFlags: {
                    [FeatureFlag.IsBluetoothEnabled]: false,
                },
            });

            // BT-specific info
            expect(queryByText('Can I connect my Trezor to Trezor Suite on Mobile?')).toBeNull();
        });

        it('should not render trading section when trading is disabled', async () => {
            mockIsTradingEnabled = false;

            const { queryByText } = await renderFAQInfoPanel({
                featureFlags: {
                    [FeatureFlag.IsBluetoothEnabled]: true,
                },
            });

            expect(queryByText('What trading features are available?')).toBeNull();
        });
    });
});
