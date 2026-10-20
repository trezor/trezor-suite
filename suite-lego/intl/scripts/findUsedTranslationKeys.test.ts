import fs from 'fs';
import os from 'os';
import path from 'path';

import { findUsedTranslationKeys } from './findUsedTranslationKeys';

// The single-pass grep is the load-bearing part of the unused-translations check:
// it has to find every genuinely-used key while not falsely matching keys that
// only appear as substrings, in the definition file, or in unscanned files.
// Assert that behavior against a real grep run rather than the static args.
describe('findUsedTranslationKeys', () => {
    let dir: string;

    beforeAll(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grep-translations-'));
        fs.writeFileSync(
            path.join(dir, 'used.ts'),
            `const a = <Translation id="TR_USED" />;\n` +
                `const b = <Translation id="TR_PARTIAL_LONGER" />;\n`,
        );
        // messages.ts is excluded, so a key that appears only here must stay unused.
        fs.writeFileSync(path.join(dir, 'messages.ts'), `TR_DEFINED_ONLY: { ... }\n`);
        // .js is not in the scanned extensions, so a key only here must stay unused.
        fs.writeFileSync(path.join(dir, 'ignored.js'), `id="TR_IN_JS"\n`);
    });

    afterAll(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('reports a key as used only on a whole-word match in a scanned, non-definition file', () => {
        const keys = [
            'TR_USED', // present verbatim
            'TR_PARTIAL', // only ever a substring of TR_PARTIAL_LONGER
            'TR_PARTIAL_LONGER', // present verbatim
            'TR_DEFINED_ONLY', // only in the excluded messages.ts
            'TR_IN_JS', // only in a .js file
            'TR_ABSENT', // nowhere
        ];

        const used = findUsedTranslationKeys(keys, dir);
        const unused = keys.filter(key => !used.has(key));

        expect(used).toEqual(new Set(['TR_USED', 'TR_PARTIAL_LONGER']));
        expect(unused).toEqual(['TR_PARTIAL', 'TR_DEFINED_ONLY', 'TR_IN_JS', 'TR_ABSENT']);
    });

    // When nothing matches, grep exits 1; the check must read that as "all keys
    // unused", not an error. This is the path that flags every key for removal.
    it('reports every key as unused when none of them appear anywhere', () => {
        const used = findUsedTranslationKeys(['TR_ABSENT', 'TR_ALSO_ABSENT'], dir);

        expect(used).toEqual(new Set());
    });
});
