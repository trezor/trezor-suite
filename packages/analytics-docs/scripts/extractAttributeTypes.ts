import * as fs from 'node:fs';
import * as path from 'node:path';
import { Node, Project, Type, ts } from 'ts-morph';

type ExtractOptions = {
    tsConfigFilePath: string;
    eventFileGlobs: string[];
};

export type AttributeTypesByEventName = Record<string, Record<string, string>>;

const FORMAT_FLAGS =
    ts.TypeFormatFlags.NoTruncation |
    ts.TypeFormatFlags.InTypeAlias |
    ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;

const toPosix = (p: string) => p.split(path.sep).join(path.posix.sep);

export function findUp(fileName: string, startDir: string): string | undefined {
    let dir: string | undefined = startDir;
    while (dir !== undefined) {
        const candidate = path.join(dir, fileName);
        if (fs.existsSync(candidate)) return candidate;
        const parent = path.dirname(dir);
        dir = parent === dir ? undefined : parent;
    }

    return undefined;
}

export function findPackageRoot(anyPathInsidePackage: string): string | undefined {
    const pkgJson = findUp('package.json', path.dirname(anyPathInsidePackage));

    return pkgJson ? path.dirname(pkgJson) : undefined;
}

function unwrapExpression(expr: import('ts-morph').Expression): import('ts-morph').Expression {
    let e = expr;
    while (Node.isParenthesizedExpression(e)) e = e.getExpression();
    while (Node.isAsExpression(e)) e = e.getExpression();
    while (Node.isSatisfiesExpression(e)) e = e.getExpression();
    while (Node.isNonNullExpression(e)) e = e.getExpression();

    return e;
}

function getLiteralTextFromCompilerNode(init: ts.Expression | undefined): string | undefined {
    if (!init) return undefined;
    if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) return init.text;

    return undefined;
}

function resolvePropertyAccessToLiteral(expr: import('ts-morph').Expression): string | undefined {
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
}

function evalStringValue(expr: import('ts-morph').Expression): string | undefined {
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
}

function stripUndefinedFromUnion(t: Type): Type {
    if (!t.isUnion()) return t;
    const nonUndef = t.getUnionTypes().filter(u => !u.isUndefined());

    return nonUndef.length === 1 ? nonUndef[0] : t;
}

function getAttributeValueType(attributeType: Type, isOptional: boolean): Type {
    const base = isOptional ? stripUndefinedFromUnion(attributeType) : attributeType;
    const aliasArgs = base.getAliasTypeArguments();
    const typeArgs = aliasArgs.length ? aliasArgs : base.getTypeArguments();

    return typeArgs[0] ?? base;
}

function escapeSingleQuotes(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function formatTypeAsString(t: Type, contextNode: import('ts-morph').Node): string {
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
        const uniq = [...new Set(rendered)];

        return uniq.join('\n| ');
    }

    return t.getText(contextNode, FORMAT_FLAGS);
}

function isOptionalProperty(sym: import('ts-morph').Symbol): boolean {
    const decl = sym.getDeclarations()[0];
    if (!decl) return false;
    if (Node.isPropertySignature(decl)) return decl.hasQuestionToken();
    if (Node.isPropertyDeclaration(decl)) return decl.hasQuestionToken();

    return false;
}

function getEventNameFromDeclaration(
    varDecl: import('ts-morph').VariableDeclaration,
): string | undefined {
    const init = varDecl.getInitializer();
    if (!init) return undefined;
    const expr = unwrapExpression(init);
    if (!Node.isObjectLiteralExpression(expr)) return undefined;
    const nameProp = expr.getProperty('name');
    if (!nameProp || !Node.isPropertyAssignment(nameProp)) return undefined;
    const rhs = nameProp.getInitializer();

    return rhs ? evalStringValue(rhs) : undefined;
}

function getEventDefTypeArgs(
    varDecl: import('ts-morph').VariableDeclaration,
): { attributesType: Type; nameType?: Type } | undefined {
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
}

function extractAttributeTypesFromType(
    attributesType: Type,
    varDecl: import('ts-morph').VariableDeclaration,
): Record<string, string> {
    const out: Record<string, string> = {};
    for (const p of attributesType.getProperties()) {
        const optional = isOptionalProperty(p);
        const propType = p.getTypeAtLocation(varDecl);
        const valueType = getAttributeValueType(propType, optional);
        out[p.getName()] = formatTypeAsString(valueType, varDecl);
    }

    return out;
}

function tryGetEventName(
    varDecl: import('ts-morph').VariableDeclaration,
    typeArgs: { attributesType: Type; nameType?: Type },
): string | undefined {
    const fromObject = getEventNameFromDeclaration(varDecl);
    if (fromObject) return fromObject;
    if (typeArgs.nameType?.isStringLiteral()) {
        const lit = typeArgs.nameType.getLiteralValue();

        return typeof lit === 'string' ? lit : undefined;
    }

    return undefined;
}

function collectFromSourceFile(sf: import('ts-morph').SourceFile): {
    result: AttributeTypesByEventName;
    unresolved: Array<{ file: string; exportName: string }>;
} {
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
}

function createProjectAndAddSources(opts: ExtractOptions): Project {
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
}

export function extractAttributeTypesByEventName(opts: ExtractOptions): AttributeTypesByEventName {
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
}
