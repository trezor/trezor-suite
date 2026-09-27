import { Platform } from 'react-native';

import { isNativeSheetSupported } from './isNativeSheetSupported';

describe('isNativeSheetSupported', () => {
    it('supports standard content-sized sheets', () => {
        expect(isNativeSheetSupported()).toBe(true);
    });

    it('supports explicit snap points, theme, dismissal and visibility callbacks', () => {
        expect(
            isNativeSheetSupported({
                snapPoints: ['95%'],
                enableDynamicSizing: false,
                enablePanDownToClose: true,
                backgroundStyle: { backgroundColor: 'black' },
                onChange: jest.fn(),
                onDismiss: jest.fn(),
            }),
        ).toBe(true);
    });

    it('preserves the legacy renderer for custom animated handles and backdrops', () => {
        expect(isNativeSheetSupported({ handleComponent: () => null })).toBe(false);
        expect(isNativeSheetSupported({ backdropComponent: () => null })).toBe(false);
    });

    it('does not silently ignore animation or keyboard overrides', () => {
        expect(isNativeSheetSupported({ animationConfigs: { duration: 100 } })).toBe(false);
        expect(isNativeSheetSupported({ keyboardBehavior: 'fillParent' })).toBe(false);
    });

    it('keeps mixed dynamic and fixed snap points in the legacy renderer', () => {
        expect(isNativeSheetSupported({ snapPoints: ['50%'], enableDynamicSizing: true })).toBe(
            false,
        );
    });

    it('preserves backdrop and Back dismissal when only the pan gesture is disabled', () => {
        expect(isNativeSheetSupported({ enablePanDownToClose: false })).toBe(false);
    });
});

describe.each(['ios', 'android'] as const)('isNativeSheetSupported on %s', platform => {
    const originalPlatform = Platform.OS;

    beforeEach(() => {
        Platform.OS = platform;
    });

    afterEach(() => {
        Platform.OS = originalPlatform;
    });

    it('supports content-sized sheets', () => {
        expect(isNativeSheetSupported()).toBe(true);
        expect(isNativeSheetSupported({ enableDynamicSizing: true })).toBe(true);
    });

    it('keeps fixed sizing without snap points in the legacy renderer', () => {
        expect(isNativeSheetSupported({ enableDynamicSizing: false })).toBe(false);
        expect(isNativeSheetSupported({ enableDynamicSizing: false, snapPoints: [] })).toBe(false);
    });

    it.each([{ snapPoints: ['95%'] }, { snapPoints: ['50%', '100%'] }, { snapPoints: [320, 640] }])(
        'preserves explicit snap points $snapPoints',
        ({ snapPoints }) => {
            expect(isNativeSheetSupported({ enableDynamicSizing: false, snapPoints })).toBe(
                platform === 'ios',
            );
        },
    );
});
