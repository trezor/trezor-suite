import { readFileSync, readdirSync } from 'fs';
import path from 'path';

/**
 * TypeScript resolves `#src/...` through the `types` condition of the `imports` field in
 * package.json and, unlike the bundlers, adds no extensions and looks for no index files there.
 * So `types` lists every candidate explicitly, in an order (index before file, `.tsx` before
 * `.ts`) that keeps editor auto-imports as short as they were with the old `src/` alias.
 * Webpack, Jest and Vite resolve the `default` target with their own order instead.
 * Both orders pick the same file only while no specifier matches more than one file.
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
});
