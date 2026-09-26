import { useEffect, useState } from 'react';

import { type RenderToImageResult, renderToImageAsync } from 'expo-font';

import { type IconName, MOBILE_ICON_FONT_NAME, icons } from '@suite-native/icons';

import { rootTabsOptions } from './routes';

export type NativeTabIcons = Partial<Record<IconName, RenderToImageResult>>;

const EMPTY_NATIVE_TAB_ICONS: NativeTabIcons = {};
const tabIconNames = [
    ...new Set(
        Object.values(rootTabsOptions).flatMap(option => [option.iconName, option.focusedIconName]),
    ),
];
let nativeTabIconsPromise: Promise<NativeTabIcons> | undefined;

const getNativeTabIcons = (): Promise<NativeTabIcons> => {
    nativeTabIconsPromise ??= Promise.allSettled(
        tabIconNames.map(async iconName => ({
            iconName,
            image: await renderToImageAsync(String.fromCodePoint(icons[iconName]), {
                fontFamily: MOBILE_ICON_FONT_NAME,
                size: 24,
                lineHeight: 24,
                color: '#000000',
            }),
        })),
    ).then(results => {
        const iconImages: NativeTabIcons = {};

        for (const result of results) {
            if (result.status === 'fulfilled') {
                iconImages[result.value.iconName] = result.value.image;
            }
        }

        return iconImages;
    });

    return nativeTabIconsPromise;
};

export const useNativeTabIcons = (isEnabled: boolean): NativeTabIcons => {
    const [nativeTabIcons, setNativeTabIcons] = useState(EMPTY_NATIVE_TAB_ICONS);

    useEffect(() => {
        if (!isEnabled) return;

        let isMounted = true;

        getNativeTabIcons().then(iconImages => {
            if (isMounted) {
                setNativeTabIcons(iconImages);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [isEnabled]);

    return isEnabled ? nativeTabIcons : EMPTY_NATIVE_TAB_ICONS;
};
