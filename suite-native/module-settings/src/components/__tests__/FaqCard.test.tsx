import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { FaqCard } from '../FaqCard';

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
    const renderFaqCard = (preloadedState = {}) =>
        renderWithStoreProvider(<FaqCard />, {
            preloadedState: { ...defaultPreloadedState, ...preloadedState },
        });

    beforeEach(() => {
        mockIsTradingEnabled = true;
    });

    describe('on Android', () => {
        beforeEach(() => {
            mockIsAndroid = true;
        });

        it('should render appropriate sections when BT is enabled', () => {
            const { getByText } = renderFaqCard();

            // Android BT-specific info
            expect(getByText('For wireless connections:')).toBeOnTheScreen();

            // Trading info
            expect(getByText('What trading features are available?')).toBeOnTheScreen();
        });

        it('should not render trading section when trading is disabled', () => {
            mockIsTradingEnabled = false;

            const { queryByText } = renderFaqCard();

            expect(queryByText('What trading features are available?')).toBeNull();
        });
    });

    describe('on iOS', () => {
        beforeEach(() => {
            mockIsAndroid = false;
        });

        it('should render appropriate sections when BT is enabled', () => {
            const { getByText } = renderFaqCard();

            // iOS BT-specific info
            expect(
                getByText('Can I connect my Trezor to Trezor Suite on Mobile?'),
            ).toBeOnTheScreen();

            // Trading info
            expect(getByText('What trading features are available?')).toBeOnTheScreen();
        });

        it('should not render trading section when trading is disabled', () => {
            mockIsTradingEnabled = false;

            const { queryByText } = renderFaqCard();

            expect(queryByText('What trading features are available?')).toBeNull();
        });
    });
});
