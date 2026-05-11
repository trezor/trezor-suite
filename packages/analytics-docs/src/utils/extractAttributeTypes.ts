import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    type Expression,
    Node,
    Project,
    type SourceFile,
    type Symbol,
    type Type,
    type VariableDeclaration,
    ts,
} from 'ts-morph';

import { unique } from '@trezor/utils';

/** Options for the attribute type extraction (tsconfig path and globs for event files). */
type ExtractOptions = {
    tsConfigFilePath: string;
    eventFileGlobs: string[];
};

/** Map of event name -> (attribute name -> formatted type string). */
export type AttributeTypesByEventName = Record<string, Record<string, string>>;

const FORMAT_FLAGS =
    ts.TypeFormatFlags.NoTruncation |
    ts.TypeFormatFlags.InTypeAlias |
    ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;

/** Converts a path to POSIX format (forward slashes). */
const toPosix = (p: string) => p.split(path.sep).join(path.posix.sep);

/** Finds a file by name by walking up the directory tree from startDir. */
export const findUp = (fileName: string, startDir: string): string | undefined => {
    let dir: string | undefined = startDir;
    while (dir !== undefined) {
        const candidate = path.join(dir, fileName);
        if (fs.existsSync(candidate)) return candidate;
        const parent = path.dirname(dir);
        dir = parent === dir ? undefined : parent;
    }

    return undefined;
};

/** Returns the directory containing package.json for the package that contains the given path. */
export const findPackageRoot = (anyPathInsidePackage: string): string | undefined => {
    const pkgJson = findUp('package.json', path.dirname(anyPathInsidePackage));

    return pkgJson ? path.dirname(pkgJson) : undefined;
};

/** Unwraps parenthesized, type-assertion, satisfies, and non-null expressions to get the inner expression. */
const unwrapExpression = (expr: Expression): Expression => {
    let e = expr;
    while (Node.isParenthesizedExpression(e)) e = e.getExpression();
    while (Node.isAsExpression(e)) e = e.getExpression();
    while (Node.isSatisfiesExpression(e)) e = e.getExpression();
    while (Node.isNonNullExpression(e)) e = e.getExpression();

    return e;
};

/** Returns the string value from a TypeScript string literal or template literal node. */
const getLiteralTextFromCompilerNode = (init: ts.Expression | undefined): string | undefined => {
    if (!init) return undefined;
    if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) return init.text;

    return undefined;
};

/** Resolves a property access (e.g. enum member or object property) to its string literal value. */
const resolvePropertyAccessToLiteral = (expr: Expression): string | undefined => {
    const e = unwrapExpression(expr);
    if (!Node.isPropertyAccessExpression(e)) return undefined;

    const symbol = e.getNameNode().getSymbol();
    if (!symbol) return undefined;

    for (const d of symbol.getDeclarations()) {
        const n = d.compilerNode;
        if (ts.isEnumMember(n) || ts.isPropertyAssignment(n)) {
            const v = getLiteralTextFromCompilerNode(n.initializer);
            if (v) return v;
        }
    }

    return undefined;
};

/** Evaluates an expression to a string value (literal, enum/const reference, or string literal type). */
const evalStringValue = (expr: Expression): string | undefined => {
    const e = unwrapExpression(expr);
    if (Node.isStringLiteral(e) || Node.isNoSubstitutionTemplateLiteral(e)) {
        return e.getLiteralText();
    }
    const resolved = resolvePropertyAccessToLiteral(e);
    if (resolved) return resolved;
    const t = e.getType();
    if (t.isStringLiteral()) {
        const v = t.getLiteralValue();

        return typeof v === 'string' ? v : undefined;
    }

    return undefined;
};

/** Removes undefined from a union type; returns the single remaining type or the original union. */
const stripUndefinedFromUnion = (t: Type): Type => {
    if (!t.isUnion()) return t;
    const nonUndef = t.getUnionTypes().filter(u => !u.isUndefined());

    return nonUndef.length === 1 ? nonUndef[0] : t;
};

/** Gets the inner value type from an attribute type (handles optional and generic types like EventDef<T>). */
const getAttributeValueType = (attributeType: Type, isOptional: boolean): Type => {
    const base = isOptional ? stripUndefinedFromUnion(attributeType) : attributeType;
    const aliasArgs = base.getAliasTypeArguments();
    const typeArgs = aliasArgs.length ? aliasArgs : base.getTypeArguments();

    return typeArgs[0] ?? base;
};

/** Escapes backslashes and single quotes for safe use inside a single-quoted type string. */
const escapeSingleQuotes = (s: string): string => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/** Formats a TypeScript type as a human-readable string for display in docs. */
const formatTypeAsString = (t: Type, contextNode: Node): string => {
    if (t.isStringLiteral()) {
        const v = t.getLiteralValue();

        return typeof v === 'string'
            ? `'${escapeSingleQuotes(v)}'`
            : t.getText(contextNode, FORMAT_FLAGS);
    }
    if (t.isNumberLiteral()) return String(t.getLiteralValue());
    if (t.isBooleanLiteral()) return String(t.getLiteralValue());
    if (t.isNull()) return 'null';
    if (t.isUndefined()) return 'undefined';

    if (t.isUnion()) {
        const parts = t.getUnionTypes();
        if (parts.length > 80) return t.getText(contextNode, FORMAT_FLAGS);
        const rendered = parts.map(p => formatTypeAsString(p, contextNode));
        const uniq = unique(rendered);

        return uniq.join('\n| ');
    }

    return t.getText(contextNode, FORMAT_FLAGS);
};

/** Returns true if the symbol's declaration is an optional property (has ?). */
const isOptionalProperty = (sym: Symbol): boolean => {
    const decl = sym.getDeclarations()[0];
    if (!decl) return false;
    if (Node.isPropertySignature(decl)) return decl.hasQuestionToken();
    if (Node.isPropertyDeclaration(decl)) return decl.hasQuestionToken();

    return false;
};

/** Extracts the event name from an EventDef variable's object literal initializer (the 'name' property). */
const getEventNameFromDeclaration = (varDecl: VariableDeclaration): string | undefined => {
    const init = varDecl.getInitializer();
    if (!init) return undefined;
    const expr = unwrapExpression(init);
    if (!Node.isObjectLiteralExpression(expr)) return undefined;
    const nameProp = expr.getProperty('name');
    if (!nameProp || !Node.isPropertyAssignment(nameProp)) return undefined;
    const rhs = nameProp.getInitializer();

    return rhs ? evalStringValue(rhs) : undefined;
};

/** Gets the type arguments (attributes type and optional name type) from a variable typed as EventDef<T> or EventDef<T, N>. */
const getEventDefTypeArgs = (
    varDecl: VariableDeclaration,
): { attributesType: Type; nameType?: Type } | undefined => {
    const typeNode = varDecl.getTypeNode();
    const typeRef = typeNode?.asKind(ts.SyntaxKind.TypeReference);
    if (typeRef) {
        const typeName = typeRef.getTypeName();
        if (Node.isIdentifier(typeName) && typeName.getText() === 'EventDef') {
            const typeArgs = typeRef.getTypeArguments();
            if (typeArgs.length >= 1) {
                return {
                    attributesType: typeArgs[0].getType(),
                    nameType: typeArgs[1]?.getType(),
                };
            }
        }
    }
    const t = varDecl.getType();
    const alias = t.getAliasSymbol();
    if (!alias || alias.getName() !== 'EventDef') return undefined;
    const args = t.getAliasTypeArguments();
    if (args.length < 1) return undefined;

    return { attributesType: args[0], nameType: args[1] };
};

/** Key used for events whose attributes type is a single Record/index type (no named properties). */
export const RECORD_TYPE_ATTRIBUTE_KEY = '[key: string]';

/** Builds a map of attribute name to formatted type string from an EventDef attributes type. */
const extractAttributeTypesFromType = (
    attributesType: Type,
    varDecl: VariableDeclaration,
): Record<string, string> => {
    const out: Record<string, string> = {};
    const properties = attributesType.getProperties();
    if (properties.length > 0) {
        for (const p of properties) {
            const optional = isOptionalProperty(p);
            const propType = p.getTypeAtLocation(varDecl);
            const valueType = getAttributeValueType(propType, optional);
            out[p.getName()] = formatTypeAsString(valueType, varDecl);
        }

        return out;
    }
    // No named properties – empty object {} has no attributes to show; Record<K,V> has one row.
    const formatted = formatTypeAsString(attributesType, varDecl);
    if (formatted === '{}') return out;
    out[RECORD_TYPE_ATTRIBUTE_KEY] = formatted;

    return out;
};

/** Tries to get the event name from the declaration's object literal or from the EventDef name type parameter. */
const tryGetEventName = (
    varDecl: VariableDeclaration,
    typeArgs: { attributesType: Type; nameType?: Type },
): string | undefined => {
    const fromObject = getEventNameFromDeclaration(varDecl);
    if (fromObject) return fromObject;
    if (typeArgs.nameType?.isStringLiteral()) {
        const lit = typeArgs.nameType.getLiteralValue();

        return typeof lit === 'string' ? lit : undefined;
    }

    return undefined;
};

/** Collects attribute types by event name from a source file and tracks exports whose event name could not be resolved. */
const collectFromSourceFile = (
    sf: SourceFile,
): {
    result: AttributeTypesByEventName;
    unresolved: Array<{ file: string; exportName: string }>;
} => {
    const result: AttributeTypesByEventName = {};
    const unresolved: Array<{ file: string; exportName: string }> = [];

    if (sf.getFilePath().endsWith('.d.ts')) return { result, unresolved };

    for (const v of sf.getVariableDeclarations()) {
        if (!v.isExported()) continue;
        const typeArgs = getEventDefTypeArgs(v);
        if (!typeArgs) continue;

        const eventName = tryGetEventName(v, typeArgs);
        if (!eventName) {
            unresolved.push({
                file: sf.getFilePath(),
                exportName: v.getName() ?? '<anonymous>',
            });
            continue;
        }
        result[eventName] = extractAttributeTypesFromType(typeArgs.attributesType, v);
    }

    return { result, unresolved };
};

/** Creates a ts-morph Project and adds source files matching the configured event file globs. */
const createProjectAndAddSources = (opts: ExtractOptions): Project => {
    const project = new Project({
        tsConfigFilePath: opts.tsConfigFilePath,
        skipAddingFilesFromTsConfig: true,
    });
    const absGlobs = opts.eventFileGlobs.map(g =>
        toPosix(path.isAbsolute(g) ? g : path.resolve(g)),
    );
    project.addSourceFilesAtPaths(absGlobs);
    project.resolveSourceFileDependencies();

    return project;
};

/** Extracts attribute types for all EventDef exports across the given files and returns a map of event name to attribute types. */
export const extractAttributeTypesByEventName = (
    opts: ExtractOptions,
): AttributeTypesByEventName => {
    const project = createProjectAndAddSources(opts);
    const merged: AttributeTypesByEventName = {};
    const allUnresolved: Array<{ file: string; exportName: string }> = [];

    for (const sf of project.getSourceFiles()) {
        const { result, unresolved } = collectFromSourceFile(sf);
        Object.assign(merged, result);
        allUnresolved.push(...unresolved);
    }

    if (allUnresolved.length > 0) {
        console.warn(
            `[analytics-docs] extractAttributeTypes: could not resolve event name for ${allUnresolved.length} exports`,
        );
        console.warn(
            allUnresolved
                .slice(0, 30)
                .map(x => `  - ${x.exportName} (${x.file})`)
                .join('\n'),
        );
    }

    return merged;
};
