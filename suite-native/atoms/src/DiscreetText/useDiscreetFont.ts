import { useEffect, useMemo, useState } from 'react';
import { Image } from 'react-native';

import { type SkFont, type SkTypeface, Skia } from '@shopify/react-native-skia';

const satoshiFont = require('../../../../packages/theme/fonts/TTSatoshi-Medium.otf');

// react-native-skia's useFont/useTypeface reloads the font asynchronously on every
// mount without caching, so remounting the DiscreetCanvas (e.g. on every discreet-mode
// toggle) leaves `font` null for the whole async load window and the blur flashes blank.
// We load the typeface once and keep it at module scope so subsequent mounts resolve it
// synchronously.
let cachedTypeface: SkTypeface | null = null;
let typefacePromise: Promise<SkTypeface | null> | null = null;

const loadTypeface = () => {
    if (typefacePromise) return typefacePromise;

    typefacePromise = (async () => {
        try {
            const uri = Image.resolveAssetSource(satoshiFont)?.uri;
            if (!uri) return null;

            const data = await Skia.Data.fromURI(uri);
            cachedTypeface = Skia.Typeface.MakeFreeTypeFaceFromData(data);

            return cachedTypeface;
        } catch {
            // Allow a later mount to retry if the one-off load failed.
            typefacePromise = null;

            return null;
        }
    })();

    return typefacePromise;
};

// Start loading the typeface before it is first needed (e.g. while DiscreetText is
// rendered but discreet mode is still off), so the first toggle already has it ready.
export const preloadDiscreetFont = () => {
    loadTypeface();
};

export const useDiscreetFont = (fontSize: number): SkFont | null => {
    const [typeface, setTypeface] = useState(cachedTypeface);

    useEffect(() => {
        if (typeface) return;

        let isMounted = true;
        loadTypeface().then(loaded => {
            if (isMounted) setTypeface(loaded);
        });

        return () => {
            isMounted = false;
        };
    }, [typeface]);

    return useMemo(() => (typeface ? Skia.Font(typeface, fontSize) : null), [typeface, fontSize]);
};
