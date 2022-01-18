const units = ['B', 'KB', 'MB', 'GB', 'TB'];

/**
 *
 * @param bytes amount fo bytes
 * @returns String with the human redable size of bytes
 */
export const bytesToHumanReadable = (bytes: number): string => {
    let size = Math.abs(bytes);
    let i = 0;

    while (size >= 1024 || i >= units.length) {
        size /= 1024;
        i++;
    }

    return `${size.toFixed(1)} ${units[i]}`;
};
