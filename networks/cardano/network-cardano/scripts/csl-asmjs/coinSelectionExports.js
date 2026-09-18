// Lists the Cardano Serialization Lib exports that @fivebinaries/coin-selection references
// statically (`<alias>.Class.member`), independent of what the tests happen to execute.
// Instance methods are not visible here; generate.js keeps whole classes for those.
import fs from 'node:fs';
import path from 'node:path';

const CSL_REQUIRE =
    /const (\w+) = (?:__importStar\()?require\("@emurgo\/cardano-serialization-lib-nodejs"\)/g;
// Matches string literals (captured, kept) and comments (dropped) so a `//` inside a string does
// not truncate the line.
const STRING_OR_COMMENT =
    /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\/\*[\s\S]*?\*\/|\/\/.*/g;

const stripComments = source =>
    source.replace(STRING_OR_COMMENT, (match, stringLiteral) => stringLiteral ?? '');

const listJsFiles = dir =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return listJsFiles(entryPath);

        return entry.name.endsWith('.js') ? [entryPath] : [];
    });

export const findCoinSelectionExports = coinSelectionLibDir => {
    const exportNames = new Set();
    listJsFiles(coinSelectionLibDir).forEach(file => {
        const source = stripComments(fs.readFileSync(file, 'utf8'));
        const aliases = [...source.matchAll(CSL_REQUIRE)].map(([, alias]) => alias);
        if (aliases.length === 0 && source.includes('@emurgo/cardano-serialization-lib')) {
            throw new Error(`csl-asmjs: unrecognised Cardano Serialization Lib import in ${file}`);
        }

        aliases.forEach(alias => {
            const reference = new RegExp(`\\b${alias}\\.([A-Z]\\w*)\\.([a-z]\\w*)`, 'g');
            [...source.matchAll(reference)].forEach(([, className, member]) =>
                exportNames.add(`${className.toLowerCase()}_${member}`),
            );
        });
    });

    return [...exportNames].sort();
};
