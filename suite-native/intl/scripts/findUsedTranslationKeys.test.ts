import fs from 'fs';
import os from 'os';
import path from 'path';

import { findUsedTranslationKeys } from './findUsedTranslationKeys';

// Assert the unused-translations check against a real grep run rather than the
// static args: it has to find every genuinely-used key while not falsely matching
// keys that only appear as substrings, in the definition file, or in unscanned files.
describe('findUsedTranslationKeys', () => {
    let dir: string;

    beforeAll(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grep-translations-'));
        // create the file that actually uses the translation strings, and isn't excluded
        fs.writeFileSync(
            path.join(dir, 'used.ts'),
            `const a = translate('moduleHome.title');\n` +
                `const b = <Translate id="moduleHome.partialLonger" />;\n`,
        );
        // messages.ts is excluded, so a key that appears only here is flagged as unused
        fs.writeFileSync(path.join(dir, 'messages.ts'), `moduleHome: { definedOnly: '...' }\n`);
        // .js is not in the scanned extensions, so a key only here is flagged as unused
        fs.writeFileSync(path.join(dir, 'ignored.js'), `translate('moduleHome.inJs')\n`);
        // A dot in a key must match a literal dot, not be interpreted as a wildcard – e.g. match the X character:
        fs.writeFileSync(path.join(dir, 'dot.ts'), `translate('moduleHomeXdot')\n`);
    });

    afterAll(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('reports a key as used only on a whole-word match in a scanned, non-definition file', () => {
        const keys = [
            'moduleHome.title', // present verbatim
            'moduleHome.partialLonger', // present verbatim
            'moduleHome.partial', // only present as a substring of moduleHome.partialLonger
            'moduleHome.definedOnly', // only in the excluded messages.ts
            'moduleHome.inJs', // only in a .js file (not scanned)
            'moduleHome.dot', // would match if the dot were a regex wildcard, but won't match moduleHomeXdot
            'moduleHome.absent', // referenced nowhere
        ];

        const used = findUsedTranslationKeys(keys, dir);
        const unused = keys.filter(key => !used.has(key));

        expect(used).toEqual(new Set(['moduleHome.title', 'moduleHome.partialLonger']));
        expect(unused).toEqual([
            'moduleHome.partial',
            'moduleHome.definedOnly',
            'moduleHome.inJs',
            'moduleHome.dot',
            'moduleHome.absent',
        ]);
    });

    it('does not let a key be interpreted by a shell', () => {
        const marker = path.join(dir, 'injected');
        const used = findUsedTranslationKeys([`moduleHome.title$(touch ${marker})`], dir);

        expect(used).toEqual(new Set());
        expect(fs.existsSync(marker)).toBe(false);
    });

    // When nothing matches, grep exits 1; the check must read that as "all keys
    // unused", not an error. This is the path that flags every key for removal.
    it('reports every key as unused when none of them appear anywhere', () => {
        const used = findUsedTranslationKeys(['moduleHome.absent', 'moduleHome.alsoAbsent'], dir);

        expect(used).toEqual(new Set());
    });
});
