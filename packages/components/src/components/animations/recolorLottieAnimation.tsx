import { hexToRgbaArray } from '@trezor/utils';

// @ts-expect-error
type JsonValue = string | number | boolean | null | Record<string, JsonValue> | JsonValue[];

type LottieAnimation = JsonValue;

const areColorsClose = (a: number[], b: number[], tolerance = 0.01) =>
    a.length === 4 && b.length === 4 && a.every((v, i) => Math.abs(v - (b[i] ?? 0)) < tolerance);

type ColorReplacement = {
    color: number[];
    rgba: number[];
    opacity: number;
};

const applyOpacity = (
    opacity: any,
    alpha: number,
    appliedOpacities: WeakMap<object, Set<number>>,
) => {
    if (typeof opacity !== 'object' || opacity === null) {
        return;
    }

    const appliedAlphas = appliedOpacities.get(opacity);

    if (appliedAlphas?.has(alpha)) {
        return;
    }

    appliedOpacities.set(opacity, new Set([...(appliedAlphas ?? []), alpha]));

    if (typeof opacity?.k === 'number') {
        opacity.k *= alpha;
    }

    if (Array.isArray(opacity?.k)) {
        opacity.k.forEach((keyframe: any) => {
            if (Array.isArray(keyframe.s)) {
                keyframe.s = keyframe.s.map((value: number) => value * alpha);
            }

            if (Array.isArray(keyframe.e)) {
                keyframe.e = keyframe.e.map((value: number) => value * alpha);
            }
        });
    }
};

const replaceStaticLottieColor = (color: number[], findReplacement: FindReplacement) => {
    const replacement = findReplacement(color);

    if (replacement === null) {
        return null;
    }

    return {
        color: replacement.color,
        opacity: replacement.opacity,
    };
};

type FindReplacement = (color: number[]) => ColorReplacement | null;

const replaceAnimatedLottieColor = (keyframes: any[], findReplacement: FindReplacement) => {
    let opacity: number | null = null;

    keyframes.forEach(keyframe => {
        if (Array.isArray(keyframe.s)) {
            const replacement = findReplacement(keyframe.s);

            if (replacement !== null) {
                keyframe.s = replacement.color;
                opacity = replacement.opacity;
            }
        }

        if (Array.isArray(keyframe.e)) {
            const replacement = findReplacement(keyframe.e);

            if (replacement !== null) {
                keyframe.e = replacement.color;
                opacity = replacement.opacity;
            }
        }
    });

    return opacity;
};

const replaceGradientColors = (gradient: any, findReplacement: FindReplacement) => {
    const colorStopsCount = gradient?.p;
    const values = gradient?.k?.k;

    if (
        typeof colorStopsCount !== 'number' ||
        !Array.isArray(values) ||
        !values.every(value => typeof value === 'number')
    ) {
        return;
    }

    let opacity: number | null = null;
    const colorValuesEnd = colorStopsCount * 4;

    for (let i = 0; i < colorValuesEnd; i += 4) {
        const replacement = findReplacement([
            Number(values[i + 1]),
            Number(values[i + 2]),
            Number(values[i + 3]),
            1,
        ]);

        if (replacement !== null) {
            values.splice(i + 1, 3, ...replacement.color.slice(0, 3));
            opacity = replacement.opacity;
        }
    }

    if (opacity !== null) {
        for (let i = colorValuesEnd; i <= values.length - 2; i += 2) {
            values[i + 1] = Number(values[i + 1]) * opacity;
        }
    }
};

export const recolorLottieAnimation = (
    data: LottieAnimation,
    replacements: { from: string; to: string }[] | null,
): LottieAnimation => {
    if (replacements === null || replacements.length === 0) {
        return data;
    }

    const colorPairs = replacements.map(({ from, to }) => ({
        from: hexToRgbaArray(from),
        to: hexToRgbaArray(to),
    }));

    const cloned = JSON.parse(JSON.stringify(data));
    const appliedOpacities = new WeakMap<object, Set<number>>();

    const findReplacement = (color: number[]): ColorReplacement | null => {
        for (const { from, to } of colorPairs) {
            if (areColorsClose(color, from)) {
                return {
                    color: [to[0] ?? 0, to[1] ?? 0, to[2] ?? 0, 1],
                    rgba: to,
                    opacity: to[3] ?? 1,
                };
            }
        }

        return null;
    };

    const walk = (node: any, layerOpacity?: any) => {
        if (Array.isArray(node)) {
            if (node.length === 4 && node.every(n => typeof n === 'number')) {
                const replacement = findReplacement(node);

                if (replacement) {
                    node.splice(0, 4, ...replacement.rgba);
                }
            }

            node.forEach(child => walk(child, layerOpacity));
        } else if (typeof node === 'object' && node !== null) {
            const currentLayerOpacity = node.ks?.o ?? layerOpacity;

            // Lottie gradient colors store [offset, r, g, b] stops and separate opacity stops.
            replaceGradientColors(node.g, findReplacement);

            for (const key in node) {
                if (Object.prototype.hasOwnProperty.call(node, key)) {
                    const value = node[key];

                    // Simple Lottie fill/stroke color with sibling opacity.
                    if (
                        Array.isArray(value?.k) &&
                        value.k.length === 4 &&
                        value.k.every((n: unknown) => typeof n === 'number')
                    ) {
                        const replacement = replaceStaticLottieColor(value.k, findReplacement);

                        if (replacement) {
                            value.k = replacement.color;
                            applyOpacity(
                                currentLayerOpacity ?? node.o,
                                replacement.opacity,
                                appliedOpacities,
                            );
                            continue;
                        }
                    }

                    // Animated Lottie fill/stroke color with sibling opacity.
                    if (
                        Array.isArray(value?.k) &&
                        value.k.every((keyframe: unknown) => typeof keyframe === 'object')
                    ) {
                        const opacity = replaceAnimatedLottieColor(value.k, findReplacement);

                        if (opacity !== null) {
                            applyOpacity(currentLayerOpacity ?? node.o, opacity, appliedOpacities);
                            continue;
                        }
                    }

                    // Simple rgba color.
                    if (
                        Array.isArray(value) &&
                        value.length === 4 &&
                        value.every(n => typeof n === 'number')
                    ) {
                        const replacement = findReplacement(value);
                        if (replacement) {
                            node[key] = replacement.rgba;
                            continue;
                        }
                    }

                    walk(value, currentLayerOpacity);
                }
            }
        }
    };

    walk(cloned);

    return cloned;
};
