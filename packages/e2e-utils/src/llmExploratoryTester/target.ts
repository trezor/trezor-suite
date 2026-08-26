// Accepts a trezor-suite PR URL, e.g.
// https://github.com/trezor/trezor-suite/pull/123
export function parsePrNumber(input: string | undefined): number {
    const match = input
        ?.trim()
        .match(/^https:\/\/github\.com\/trezor\/trezor-suite\/pull\/(\d+)\/?(?:[?#].*)?$/i);

    if (!match?.[1]) {
        throw new Error(`TARGET must be a trezor-suite PR URL, got: ${input ?? '(empty)'}`);
    }

    return Number(match[1]);
}
