import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { FaqInfoPanel } from '../FaqInfoPanel';

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

describe('FaqInfoPanel', () => {
    const renderFAQInfoPanel = (preloadedState: PreloadedState = {}) =>
        renderWithStoreProviderAsync(<FaqInfoPanel />, { preloadedState });

    beforeEach(() => {
        mockIsTradingEnabled = true;
    });

    describe('on Android', () => {
        beforeEach(() => {
            mockIsAndroid = true;
        });

        it('should render appropriate sections when BT is enabled', async () => {
            const { getByText } = await renderFAQInfoPanel();

            // Android BT-specific info
            expect(getByText('For wireless connections:')).toBeOnTheScreen();

            // Trading info
            expect(getByText('What trading features are available?')).toBeOnTheScreen();
        });

        it('should not render trading section when trading is disabled', async () => {
            mockIsTradingEnabled = false;

            const { queryByText } = await renderFAQInfoPanel();

            expect(queryByText('What trading features are available?')).toBeNull();
        });
    });

    describe('on iOS', () => {
        beforeEach(() => {
            mockIsAndroid = false;
        });

        it('should render appropriate sections when BT is enabled', async () => {
            const { getByText } = await renderFAQInfoPanel();

            // iOS BT-specific info
            expect(
                getByText('Can I connect my Trezor to Trezor Suite on Mobile?'),
            ).toBeOnTheScreen();

            // Trading info
            expect(getByText('What trading features are available?')).toBeOnTheScreen();
        });

        it('should not render trading section when trading is disabled', async () => {
            mockIsTradingEnabled = false;

            const { queryByText } = await renderFAQInfoPanel();

            expect(queryByText('What trading features are available?')).toBeNull();
        });
    });
});
