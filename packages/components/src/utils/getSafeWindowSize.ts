const roundDownFloatOrFallback = (value: string, fallback: number) => {
    const parsed = Math.floor(parseFloat(value));

    return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * Get window size and try to round it down if it's a fractional number.
 * Can happen at Windows with scaling enabled, see https://github.com/trezor/trezor-suite/issues/15195
 */
export const getSafeWindowSize = () => {
    // window.innerWidth is always integer, but computedStyle bears the actual value if it's fractional
    const computedStyle = window.getComputedStyle(document.body);
    // but we have to convert from 'px' to number, so let's do it safely with fallback
    const windowWidth = roundDownFloatOrFallback(computedStyle.width, window.innerWidth);
    const windowHeight = roundDownFloatOrFallback(computedStyle.height, window.innerHeight);

    return { windowWidth, windowHeight };
};
