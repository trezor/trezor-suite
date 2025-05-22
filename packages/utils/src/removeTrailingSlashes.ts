/**
 * Removes all trailing slashes from a given string.
 *
 * * We could use regex `/\/+$/` but it might run slow on strings with many repetitions of '/' so in order
 * to avoid potential DoS from input we use the Loop instead.
 */
export const removeTrailingSlashes = (input: string | null | undefined): string => {
    if (!input) {
        return input || '';
    }

    let i = input.length;
    // Iterate backwards until we find something else than slash
    while (i > 0 && input[i - 1] === '/') {
        i--;
    }

    return input.substring(0, i);
};
