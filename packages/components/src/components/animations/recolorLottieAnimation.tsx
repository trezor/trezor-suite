import { hexToRgbaArray } from '@trezor/utils';

// @ts-expect-error
type JsonValue = string | number | boolean | null | Record<string, JsonValue> | JsonValue[];

type LottieAnimation = JsonValue;

const areColorsClose = (a: number[], b: number[], tolerance = 0.01) =>
    a.length === 4 && b.length === 4 && a.every((v, i) => Math.abs(v - b[i]) < tolerance);

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

    const findReplacement = (color: number[]): number[] | null => {
        for (const { from, to } of colorPairs) {
            if (areColorsClose(color, from)) {
                return to;
            }
        }

        return null;
    };

    const walk = (node: any) => {
        if (Array.isArray(node)) {
            // Find RGBA quartets in row (e.g. in gradients)
            for (let i = 0; i <= node.length - 4; i++) {
                const segment = node.slice(i, i + 4);
                if (segment.every(n => typeof n === 'number')) {
                    const replacement = findReplacement(segment);
                    if (replacement) {
                        node.splice(i, 4, ...replacement);
                        i += 3;
                    }
                }
            }

            node.forEach(walk);
        } else if (typeof node === 'object' && node !== null) {
            for (const key in node) {
                // eslint-disable-next-line no-prototype-builtins
                if (node.hasOwnProperty(key)) {
                    const value = node[key];

                    // Simple rgba color
                    if (
                        Array.isArray(value) &&
                        value.length === 4 &&
                        value.every(n => typeof n === 'number')
                    ) {
                        const replacement = findReplacement(value);
                        if (replacement) {
                            node[key] = replacement;
                            continue;
                        }
                    }

                    walk(value);
                }
            }
        }
    };

    walk(cloned);

    return cloned;
};
