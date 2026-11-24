import { app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

export const RENDERER_DIRECTORY = path.resolve(app.getAppPath(), 'build');

export const isFileUrlInsideDirectory = (fileUrl: URL): boolean => {
    // The URL keeps percent-encoding (for example `%65tc` === `etc`), so comparing the URL string would not do.
    let relativePath: string;
    try {
        const filePath = fileURLToPath(fileUrl);
        relativePath = path.relative(RENDERER_DIRECTORY, filePath);
    } catch {
        return false;
    }

    return (
        relativePath !== '' && // The base dir itself (path.relative returns '' for equal paths).
        relativePath !== '..' && // Exact parent, which startsWith('..' + sep) misses.
        !relativePath.startsWith(`..${path.sep}`) && // Any other escape, '../x'.
        !path.isAbsolute(relativePath) // Cross-volume on Windows (different drive or UNC vs drive).
    );
};
