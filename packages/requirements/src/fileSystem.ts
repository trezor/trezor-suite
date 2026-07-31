import { type Dirent, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';

export type WalkDirectoryEntry = {
    readonly path: string;
    readonly entry: Dirent;
};

export type WalkDirectoryOptions = {
    /** Filter callback to crawl or exclude directories based on arbitrary condition. */
    readonly shouldEnterDirectory?: (entry: WalkDirectoryEntry) => boolean;
    /** Filter callback to keep or exclude files based on arbitrary condition. */
    readonly fileFilter?: (entry: WalkDirectoryEntry) => boolean;
};

export function* walkDirectory(
    directoryPath: string,
    options: WalkDirectoryOptions = {},
): Generator<WalkDirectoryEntry> {
    for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
        const walkedEntry = {
            path: join(directoryPath, entry.name),
            entry,
        };

        if (entry.isDirectory()) {
            if (options.shouldEnterDirectory?.(walkedEntry) !== false) {
                yield* walkDirectory(walkedEntry.path, options);
            }

            continue;
        }

        // Technically, `shouldEnterDirectory` and `fileFilter` could be unified, as they both work over the Dirent abstraction,
        // so one filter could do both. But in practice, different conditions are used to exclude directories vs. filter files.
        // So it'd be impractical to use (would have to use isFile, isDirectory everywhere).
        if (options.fileFilter?.(walkedEntry) === false) continue;

        yield walkedEntry;
    }
}

export const normalizePath = (filePath: string): string => filePath.split(sep).join('/');
