// Lists the Cardano Serialization Lib exports that @fivebinaries/coin-selection can reach, derived
// from its source and the glue.
import fs from 'node:fs';
import path from 'node:path';

const CSL_REQUIRE =
    /const (\w+) = (?:__importStar\()?require\("@emurgo\/cardano-serialization-lib-nodejs"\)/g;
// Matches string literals (captured, kept) and comments (dropped) so a `//` inside a string does
// not truncate the line.
const STRING_OR_COMMENT =
    /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\/\*[\s\S]*?\*\/|\/\/.*/g;
const MEMBER_ACCESS = /\.([a-z_]\w*)/g;
const COMPUTED_CALL = /\]\s*\(/;

const GLUE_CLASS_START = /^export class (\w+)/;
const GLUE_METHOD_START = /^ {4}(?:static )?(\w+)\(.*\) \{$/;
const GLUE_CLASS_MEMBER_LINE = /^ {4}\S/;
const GLUE_CLASS_COMMENT_OR_END = /^ {4}(?:\/[/*]|\*|\})/;
const GLUE_FUNCTION_START = /^export function (\w+)\(/;
const GLUE_WASM_CALL = /\bwasm\.(\w+)/g;
const GLUE_WRAP = /\b(\w+)\.__wrap\(/g;

const stripComments = source =>
    source.replace(STRING_OR_COMMENT, (match, stringLiteral) => stringLiteral ?? '');

const listJsFiles = dir =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return listJsFiles(entryPath);

        return entry.name.endsWith('.js') ? [entryPath] : [];
    });

const readCoinSelectionSources = coinSelectionLibDir =>
    listJsFiles(coinSelectionLibDir).map(file => {
        const source = stripComments(fs.readFileSync(file, 'utf8'));
        const aliases = [...source.matchAll(CSL_REQUIRE)].map(([, alias]) => alias);
        if (aliases.length === 0 && source.includes('@emurgo/cardano-serialization-lib')) {
            throw new Error(`csl-asmjs: unrecognised Cardano Serialization Lib import in ${file}`);
        }

        return { file, source, aliases };
    });

export const findCoinSelectionMemberNames = coinSelectionLibDir => {
    const memberNames = new Set();
    readCoinSelectionSources(coinSelectionLibDir).forEach(({ file, source }) => {
        if (COMPUTED_CALL.test(source)) {
            throw new Error(`csl-asmjs: computed member call in ${file}`);
        }

        [...source.matchAll(MEMBER_ACCESS)].forEach(([, memberName]) =>
            memberNames.add(memberName),
        );
    });

    return [...memberNames].sort();
};

export const findCoinSelectionClassNames = coinSelectionLibDir => {
    const classNames = new Set();
    readCoinSelectionSources(coinSelectionLibDir).forEach(({ source, aliases }) => {
        aliases.forEach(alias => {
            const reference = new RegExp(`\\b${alias}\\.([A-Z]\\w*)`, 'g');
            [...source.matchAll(reference)].forEach(([, className]) => classNames.add(className));
        });
    });

    return [...classNames].sort();
};

const createMember = () => ({ exports: new Set(), returnedClasses: new Set() });

export const parseGlue = glueSource => {
    const classes = new Map();
    const functions = new Map();
    const plumbing = createMember();
    let className;
    let member = plumbing;

    glueSource.split('\n').forEach(line => {
        const classStart = line.match(GLUE_CLASS_START)?.[1];
        const methodName = className ? line.match(GLUE_METHOD_START)?.[1] : undefined;
        const functionName = line.match(GLUE_FUNCTION_START)?.[1];

        if (classStart) {
            className = classStart;
            classes.set(className, new Map());
            member = plumbing;
        } else if (methodName) {
            member = createMember();
            classes.get(className).set(methodName, member);
        } else if (functionName) {
            member = /^__wb(g|indgen)/.test(functionName) ? plumbing : createMember();
            if (member !== plumbing) functions.set(functionName, member);
        } else if (line.startsWith('}')) {
            className = undefined;
            member = plumbing;
        } else if (
            className &&
            GLUE_CLASS_MEMBER_LINE.test(line) &&
            !GLUE_CLASS_COMMENT_OR_END.test(line)
        ) {
            throw new Error(`csl-asmjs: unrecognised line in glue class ${className}: ${line}`);
        }

        [...line.matchAll(GLUE_WASM_CALL)].forEach(([, exportName]) =>
            member.exports.add(exportName),
        );
        [...line.matchAll(GLUE_WRAP)].forEach(([, returnedClass]) =>
            member.returnedClasses.add(returnedClass),
        );
    });

    return { classes, functions, plumbing };
};

export const findReachableExports = (coinSelectionLibDir, glueSource) => {
    const { classes, functions, plumbing } = parseGlue(glueSource);
    const memberNames = new Set(findCoinSelectionMemberNames(coinSelectionLibDir));
    // `new CardanoWasm.Class()` reaches the constructor without a `.constructor` access.
    memberNames.add('constructor');

    const reachableExports = new Set(plumbing.exports);
    const reachedClasses = new Set();
    const pendingClasses = findCoinSelectionClassNames(coinSelectionLibDir);
    const reach = member => {
        member.exports.forEach(exportName => reachableExports.add(exportName));
        pendingClasses.push(...member.returnedClasses);
    };

    functions.forEach((member, functionName) => {
        if (memberNames.has(functionName)) reach(member);
    });
    while (pendingClasses.length > 0) {
        const className = pendingClasses.pop();
        if (reachedClasses.has(className)) continue;
        reachedClasses.add(className);
        if (!classes.has(className)) {
            throw new Error(`csl-asmjs: class ${className} not found in the glue`);
        }
        classes.get(className).forEach((member, methodName) => {
            if (memberNames.has(methodName)) reach(member);
        });
    }

    return [...reachableExports].sort();
};
