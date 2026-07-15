const units = ['B', 'KB', 'MB', 'GB', 'TB'];

/**
 *
 * @param bytes amount fo bytes
 * @returns String with the human redable size of bytes
 */
export const bytesToHumanReadable = (bytes: number): string => {
    let size = Math.abs(bytes);
    let i = 0;

    // divide down until the value fits, but stop at the largest unit ('TB')
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }

    return `${size.toFixed(1)} ${units[i]}`;
};
