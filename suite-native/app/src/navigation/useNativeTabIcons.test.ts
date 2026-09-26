import * as React from 'react';

import { type RenderToImageResult, renderToImageAsync } from 'expo-font';

import { MOBILE_ICON_FONT_NAME, icons } from '@suite-native/icons';
import { act, renderHookWithBasicProvider, waitFor } from '@suite-native/test-utils';

import { rootTabsOptions } from './routes';
import type { useNativeTabIcons as useNativeTabIconsHook } from './useNativeTabIcons';

jest.mock('expo-font', () => ({
    ...jest.requireActual('expo-font'),
    renderToImageAsync: jest.fn(),
}));

const mockedRenderToImageAsync = jest.mocked(renderToImageAsync);
const iconImage: RenderToImageResult = {
    uri: 'file:///native-tab-icon.png',
    width: 24,
    height: 24,
    scale: 3,
};
const tabIconNames = [
    'house',
    'houseFilled',
    'discover',
    'discoverFilled',
    'repeat',
    'piggyBank',
    'piggyBankFilled',
    'gear',
    'gearFilled',
] as const;

describe('useNativeTabIcons', () => {
    let useNativeTabIcons: typeof useNativeTabIconsHook;

    beforeEach(() => {
        jest.clearAllMocks();
        mockedRenderToImageAsync.mockResolvedValue(iconImage);

        // Each test gets an empty image cache while sharing React with the renderer.
        jest.isolateModules(() => {
            jest.doMock('react', () => React);
            jest.doMock('./routes', () => ({ rootTabsOptions }));
            jest.doMock('@suite-native/icons', () => ({ MOBILE_ICON_FONT_NAME, icons }));
            useNativeTabIcons = require('./useNativeTabIcons').useNativeTabIcons;
        });
    });

    it('does not render icons when native tabs are disabled', async () => {
        const { result } = await renderHookWithBasicProvider(() => useNativeTabIcons(false));

        expect(result.current).toEqual({});
        expect(mockedRenderToImageAsync).not.toHaveBeenCalled();
    });

    it('renders every original tab icon once and reuses the images after remounting', async () => {
        const { result, unmount } = await renderHookWithBasicProvider(() =>
            useNativeTabIcons(true),
        );

        await waitFor(() => expect(Object.keys(result.current)).toHaveLength(tabIconNames.length));

        for (const iconName of tabIconNames) {
            expect(mockedRenderToImageAsync).toHaveBeenCalledWith(
                String.fromCodePoint(icons[iconName]),
                { fontFamily: MOBILE_ICON_FONT_NAME, size: 24, lineHeight: 24, color: '#000000' },
            );
            expect(result.current[iconName]).toEqual(iconImage);
        }

        await unmount();

        const remounted = await renderHookWithBasicProvider(() => useNativeTabIcons(true));

        await waitFor(() => expect(remounted.result.current).toEqual(result.current));
        expect(mockedRenderToImageAsync).toHaveBeenCalledTimes(tabIconNames.length);
    });

    it('keeps available icons when rendering one of the glyphs fails', async () => {
        mockedRenderToImageAsync.mockImplementation(glyph =>
            glyph === String.fromCodePoint(icons.gear)
                ? Promise.reject(new Error('Native font rendering failed'))
                : Promise.resolve(iconImage),
        );
        const { result } = await renderHookWithBasicProvider(() => useNativeTabIcons(true));

        await waitFor(() =>
            expect(Object.keys(result.current)).toHaveLength(tabIconNames.length - 1),
        );
        expect(result.current.gear).toBeUndefined();
        expect(result.current.gearFilled).toEqual(iconImage);
        expect(result.current.house).toEqual(iconImage);
    });

    it('shares pending renders across mounts and ignores results after disabling or unmounting', async () => {
        let resolveImage: (value: RenderToImageResult) => void = () => undefined;
        const pendingImage = new Promise<RenderToImageResult>(resolve => {
            resolveImage = resolve;
        });

        mockedRenderToImageAsync.mockReturnValue(pendingImage);

        const first = await renderHookWithBasicProvider(() => useNativeTabIcons(true));
        const second = await renderHookWithBasicProvider(
            isEnabled => useNativeTabIcons(isEnabled),
            {
                initialProps: true,
            },
        );

        await first.unmount();
        await second.rerender(false);
        await act(() => resolveImage(iconImage));

        expect(second.result.current).toEqual({});
        expect(mockedRenderToImageAsync).toHaveBeenCalledTimes(tabIconNames.length);

        await second.rerender(true);
        await waitFor(() =>
            expect(Object.keys(second.result.current)).toHaveLength(tabIconNames.length),
        );
        expect(mockedRenderToImageAsync).toHaveBeenCalledTimes(tabIconNames.length);
    });
});
