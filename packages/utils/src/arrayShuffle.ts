/**
 * Randomly shuffles the elements in an array. This method
 * does not mutate the original array.
 */
export const arrayShuffle = <T>(array: readonly T[]) => {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
};
