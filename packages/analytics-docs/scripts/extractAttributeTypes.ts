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

export const findUp = (fileName: string, startDir: string) => {
    let dir = startDir;
    while (true) {
        const candidate = path.join(dir, fileName);
        if (fs.existsSync(candidate)) return candidate;

        const parent = path.dirname(dir);
        if (parent === dir) return undefined;
        dir = parent;
    }
};

export const findPackageRoot = (anyPathInsidePackage: string) => {
    const pkgJson = findUp('package.json', path.dirname(anyPathInsidePackage));

    return pkgJson ? path.dirname(pkgJson) : undefined;
};

const unwrapExpression = (expr: import('ts-morph').Expression) => {
    let e = expr;

    while (Node.isParenthesizedExpression(e)) e = e.getExpression();
    while (Node.isAsExpression(e)) e = e.getExpression();
    while (Node.isSatisfiesExpression(e)) e = e.getExpression();
    while (Node.isNonNullExpression(e)) e = e.getExpression();

    return e;
};

const getStringFromCompilerInitializer = (init: ts.Expression | undefined): string | undefined => {
    if (!init) return undefined;
    if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) return init.text;

    return undefined;
};

const resolvePropertyAccessToString = (expr: import('ts-morph').Expression): string | undefined => {
    const e = unwrapExpression(expr);
    if (!Node.isPropertyAccessExpression(e)) return undefined;

    const symbol = e.getNameNode().getSymbol();
    if (!symbol) return undefined;

    for (const d of symbol.getDeclarations()) {
        const n = d.compilerNode;

        if (ts.isEnumMember(n)) {
            const v = getStringFromCompilerInitializer(n.initializer);
            if (v) return v;
        }

        if (ts.isPropertyAssignment(n)) {
            const v = getStringFromCompilerInitializer(n.initializer);
            if (v) return v;
        }
    }

    return undefined;
};

const evalStringValue = (expr: import('ts-morph').Expression): string | undefined => {
    const e = unwrapExpression(expr);

    if (Node.isStringLiteral(e) || Node.isNoSubstitutionTemplateLiteral(e)) {
        return e.getLiteralText();
    }

    const resolved = resolvePropertyAccessToString(e);
    if (resolved) return resolved;

    const t = e.getType();
    if (t.isStringLiteral()) {
        const v = t.getLiteralValue();

        return typeof v === 'string' ? v : undefined;
    }

    return undefined;
};

const stripUndefined = (t: Type) => {
    if (!t.isUnion()) return t;
    const non = t.getUnionTypes().filter(u => !u.isUndefined());

    return non.length === 1 ? non[0] : t;
};

const unwrapAttributeDefValueType = (attributeType: Type, isOptionalProp: boolean) => {
    const base = isOptionalProp ? stripUndefined(attributeType) : attributeType;

    const aliasArgs = base.getAliasTypeArguments();
    const typeArgs = aliasArgs.length ? aliasArgs : base.getTypeArguments();

    return typeArgs[0] ?? base;
};

const escapeSingleQuotes = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const formatType = (t: Type, contextNode: import('ts-morph').Node): string => {
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

        const rendered = parts.map(p => formatType(p, contextNode));
        const uniq: string[] = [];
        for (const r of rendered) if (!uniq.includes(r)) uniq.push(r);

        return uniq.join('\n| ');
    }

    return t.getText(contextNode, FORMAT_FLAGS);
};

const isOptionalPropertySymbol = (sym: import('ts-morph').Symbol): boolean => {
    const decl = sym.getDeclarations()[0];
    if (!decl) return false;

    if (Node.isPropertySignature(decl)) return decl.hasQuestionToken();
    if (Node.isPropertyDeclaration(decl)) return decl.hasQuestionToken();

    return false;
};

const getEventNameFromEventObject = (varDecl: import('ts-morph').VariableDeclaration) => {
    const init = varDecl.getInitializer();
    if (!init) return undefined;

    const expr = unwrapExpression(init);
    if (!Node.isObjectLiteralExpression(expr)) return undefined;

    const nameProp = expr.getProperty('name');
    if (!nameProp || !Node.isPropertyAssignment(nameProp)) return undefined;

    const rhs = nameProp.getInitializer();
    if (!rhs) return undefined;

    return evalStringValue(rhs);
};

const getEventDefTypeArgs = (varDecl: import('ts-morph').VariableDeclaration) => {
    const t = varDecl.getType();
    const alias = t.getAliasSymbol();
    if (!alias || alias.getName() !== 'EventDef') return undefined;

    const args = t.getAliasTypeArguments();
    if (args.length < 1) return undefined;

    return { attributesType: args[0], nameType: args[1] };
};

export const extractAttributeTypesByEventName = (
    opts: ExtractOptions,
): AttributeTypesByEventName => {
    const project = new Project({
        tsConfigFilePath: opts.tsConfigFilePath,
        skipAddingFilesFromTsConfig: true,
    });

    const absGlobs = opts.eventFileGlobs.map(g => {
        const abs = path.isAbsolute(g) ? g : path.resolve(g);

        return toPosix(abs);
    });

    project.addSourceFilesAtPaths(absGlobs);
    project.resolveSourceFileDependencies();

    const result: AttributeTypesByEventName = {};
    const unresolvedNames: Array<{ file: string; exportName: string }> = [];

    for (const sf of project.getSourceFiles()) {
        if (sf.getFilePath().endsWith('.d.ts')) continue;

        for (const v of sf.getVariableDeclarations()) {
            if (!v.isExported()) continue;

            const typeArgs = getEventDefTypeArgs(v);
            if (!typeArgs) continue;

            let eventName = getEventNameFromEventObject(v);

            if (!eventName && typeArgs.nameType?.isStringLiteral()) {
                const lit = typeArgs.nameType.getLiteralValue();
                if (typeof lit === 'string') eventName = lit;
            }

            if (!eventName) {
                unresolvedNames.push({
                    file: sf.getFilePath(),
                    exportName: v.getName() ?? '<anonymous>',
                });
                continue;
            }

            const attributeTypes: Record<string, string> = {};
            const { attributesType } = typeArgs;

            for (const p of attributesType.getProperties()) {
                const attrName = p.getName();
                const optional = isOptionalPropertySymbol(p);

                const propType = p.getTypeAtLocation(v);
                const valueType = unwrapAttributeDefValueType(propType, optional);

                attributeTypes[attrName] = formatType(valueType, v);
            }

            result[eventName] = attributeTypes;
        }
    }

    if (unresolvedNames.length) {
        console.warn(
            `[analytics-docs] extractAttributeTypes: Could not resolve event name for ${unresolvedNames.length} exports`,
        );

        console.warn(
            unresolvedNames
                .slice(0, 30)
                .map(x => `  - ${x.exportName} (${x.file})`)
                .join('\n'),
        );
    }

    return result;
};
