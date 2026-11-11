import { readFileSync, readdirSync } from 'fs';
import path from 'path';

/**
 * TypeScript resolves `#src/...` through the `types` condition of the `imports` field in
 * package.json and, unlike the bundlers, adds no extensions and looks for no index files there.
 * So `types` lists every candidate explicitly (`.tsx` before `.ts`).
 * Webpack, Jest and Vite resolve the `default` target with their own order instead, including
 * directory index files. Both orders pick the same file only while no specifier matches more
 * than one file and `src` has no index files.
 */
const packageRoot = path.resolve(__dirname, '..');

const readTypesTargets = (): string[] => {
    const manifest = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf-8'));

    return manifest.imports['#src/*'].types;
};

const getSourceFiles = () =>
    readdirSync(path.join(packageRoot, 'src'), { recursive: true, withFileTypes: true })
        .filter(
            entry => entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts'),
        )
        .map(entry => path.join(entry.parentPath, entry.name));

describe('#src subpath imports', () => {
    it('resolve every specifier to a single source file', () => {
        const filesBySpecifier = new Map<string, string[]>();

        readTypesTargets().forEach(target => {
            const pattern = path.join(packageRoot, target);
            const prefix = pattern.slice(0, pattern.indexOf('*'));
            const suffix = pattern.slice(pattern.indexOf('*') + 1);

            getSourceFiles()
                .filter(file => file.startsWith(prefix) && file.endsWith(suffix))
                .forEach(file => {
                    const specifier = `#src/${file.slice(prefix.length, file.length - suffix.length)}`;
                    filesBySpecifier.set(specifier, [
                        ...(filesBySpecifier.get(specifier) ?? []),
                        file,
                    ]);
                });
        });

        const ambiguousSpecifiers = [...filesBySpecifier].filter(([, files]) => files.length > 1);

        expect(ambiguousSpecifiers).toEqual([]);
    });

    it('have no directory index files to resolve to', () => {
        const indexFiles = getSourceFiles().filter(file =>
            /^index\.tsx?$/.test(path.basename(file)),
        );

        expect(indexFiles).toEqual([]);
    });
});
