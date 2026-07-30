import { type Dirent, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';

export type WalkDirectoryEntry = {
    readonly path: string;
    readonly entry: Dirent;
};

export type WalkDirectoryOptions = {
    readonly shouldEnterDirectory?: (entry: WalkDirectoryEntry) => boolean;
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

        yield walkedEntry;
    }
}

export const normalizePath = (filePath: string): string => filePath.split(sep).join('/');
