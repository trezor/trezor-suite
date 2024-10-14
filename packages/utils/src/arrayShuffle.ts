import { getRandomInt } from './getRandomInt';

/**
 * Implementation of the Fisher-Yates shuffle algorithm.
 * The algorithm produces an unbiased permutation: every permutation is equally likely.
 * @link https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 *
 * This method does not mutate the original array.
 */
export const arrayShuffle = <T>(array: readonly T[]): T[] => {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = getRandomInt(0, i);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
};
