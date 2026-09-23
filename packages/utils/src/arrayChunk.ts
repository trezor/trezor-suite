/**
 *
 * @param array Array to be split into chunks.
 * @param size Maximum length of a chunk.
 * @returns Array of chunks in the original order. The last chunk holds the remainder.
 */
export const arrayChunk = <T>(array: readonly T[], size: number): T[][] => {
    if (size < 1) {
        throw new Error('arrayChunk: size must be at least 1');
    }

    return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
        array.slice(index * size, (index + 1) * size),
    );
};
