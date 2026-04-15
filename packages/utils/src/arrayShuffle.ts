/**
 * Implementation of the Fisher-Yates shuffle algorithm.
 * The algorithm produces an unbiased permutation: every permutation is equally likely.
 * @link https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 *
 * This method does not mutate the original array.
 */
export const arrayShuffle = <T>(
    array: readonly T[],
    { randomInt }: { randomInt: (min: number, max: number) => number },
): T[] => {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = randomInt(0, i + 1);

        const si = shuffled[i];
        const sj = shuffled[j];
        if (si !== undefined && sj !== undefined) {
            shuffled[i] = sj;
            shuffled[j] = si;
        }
    }

    return shuffled;
};
