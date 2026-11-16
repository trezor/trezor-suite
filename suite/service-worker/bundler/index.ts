/**
 * Build options shared by the webpack and Vite adapters.
 *
 * Webpack loads this through ts-node as CommonJS; Vite's config loader externalizes bare imports,
 * so it reaches Node as an ES module. It therefore has no relative imports and no `__dirname`:
 * the repository root is found by walking up from the working directory,
 * as `@suite-app/app/webpack/env` does.
 */
import fs from 'fs';
import path from 'path';

const findRepoRoot = (from: string) => {
    let directory = from;
    while (directory !== path.dirname(directory)) {
        if (fs.existsSync(path.join(directory, 'yarn.lock'))) {
            return directory;
        }
        directory = path.dirname(directory);
    }

    return from;
};

/** The worker reaches each bundler as a file path, so the bundler compiles it on its own. */
export const serviceWorkerSource = path.join(
    findRepoRoot(process.cwd()),
    'suite',
    'service-worker',
    'src',
    'worker',
    'sw.ts',
);
export const SERVICE_WORKER_FILE_NAME = 'sw.js';
export const MANIFEST_PLACEHOLDER = 'self.__SW_MANIFEST';
/** The bundlers' default of 2 MB would silently leave the largest chunk and two wasm files out. */
export const MAXIMUM_PRECACHED_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Directories of `static/` that are precached although their file names carry no content hash.
 */
const PRECACHED_STATIC_DIRECTORIES = 'fonts|videos|images';

/**
 * Matched against webpack asset names.
 * HTML is fetched network first, the connect popup is a separate app,
 * and the rest of `static/` holds unhashed files that the worker caches at runtime instead.
 */
export const precacheExcludePatterns = [
    /\.map$/,
    /\.html$/,
    /^connect-popup\//,
    new RegExp(`^static/(?!(?:${PRECACHED_STATIC_DIRECTORIES})/)`),
    /^release-notes\.md$/,
];

/** The same list as globs, for bundlers that scan the output directory. */
export const precacheGlobIgnores = [
    '**/*.map',
    '**/*.html',
    'connect-popup/**',
    'static/*',
    `static/!(${PRECACHED_STATIC_DIRECTORIES})/**`,
    'release-notes.md',
];

const precachedStaticFilePattern = new RegExp(`(^|/)static/(?:${PRECACHED_STATIC_DIRECTORIES})/`);

type ManifestEntry = { url: string; revision?: string | null };

/**
 * Both bundlers give an entry a `null` revision exactly when its file name carries a content hash.
 * Those are precached, and so are the static fonts and videos, under a revision of their content.
 * An unhashed file is served at the previous deploy under a newer network-first shell until the waiting
 * worker takes over: harmless for a font or a video, not for a script such as the one of the sessions
 * shared worker, which is left out.
 */
export const selectPrecachedEntries = <Entry extends ManifestEntry>(entries: Entry[]) => ({
    manifest: entries.filter(
        entry => entry.revision === null || precachedStaticFilePattern.test(entry.url),
    ),
});

/**
 * `@serwist/vite` serves the dev worker only at its exact URL, but the dev-logs option adds a query.
 * Returns the URL without the query when it asks for the worker, otherwise `undefined`.
 */
export const getWorkerUrlWithoutQuery = (url: string | undefined) => {
    const [pathname, query] = url?.split('?') ?? [];

    return query !== undefined && pathname?.endsWith(`/${SERVICE_WORKER_FILE_NAME}`)
        ? pathname
        : undefined;
};
