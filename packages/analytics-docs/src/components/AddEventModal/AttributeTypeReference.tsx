import type { ReactNode } from 'react';

import { Column, Row, Text } from '@trezor/components';

import { ATTRIBUTE_TYPE_REFERENCE_ITEMS } from './constants';

const MONO_STYLE = { fontFamily: 'monospace', whiteSpace: 'pre' } as const;
const SYNTAX_COLORS = {
    stringLiteral: '#6A8759',
    typeKeyword: '#CC7832',
    number: '#6897BB',
} as const;

/** Monospace + pre wrapper for type syntax. Optional color for highlighting. */
const Mono = ({ color, children }: { color?: string; children: ReactNode }) => (
    <span style={{ ...MONO_STYLE, ...(color && { color }) }}>{children}</span>
);

/** Same syntax highlighting as in EventCard AttributesTableRow. */
export const SyntaxHighlightedType = ({ typeStr }: { typeStr: string }) => {
    const re =
        /'([^'\\]|\\.)*'|"([^"\\]|\\.)*"|\b(string|number|boolean|bigint|symbol|null|undefined|unknown|any|never|object)\b|\b\d+(?:\.\d+)?\b/g;
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(typeStr)) !== null) {
        const [token] = match;
        if (match.index > lastIndex) {
            parts.push(typeStr.slice(lastIndex, match.index));
        }
        if (token.startsWith("'") || token.startsWith('"')) {
            parts.push(
                <Mono key={match.index} color={SYNTAX_COLORS.stringLiteral}>
                    {token}
                </Mono>,
            );
        } else if (
            [
                'string',
                'number',
                'boolean',
                'bigint',
                'symbol',
                'null',
                'undefined',
                'unknown',
                'any',
                'never',
                'object',
            ].includes(token)
        ) {
            parts.push(
                <Mono key={match.index} color={SYNTAX_COLORS.typeKeyword}>
                    {token}
                </Mono>,
            );
        } else if (/^\d/.test(token)) {
            parts.push(
                <Mono key={match.index} color={SYNTAX_COLORS.number}>
                    {token}
                </Mono>,
            );
        } else {
            parts.push(token);
        }
        lastIndex = match.index + token.length;
    }
    if (lastIndex < typeStr.length) parts.push(typeStr.slice(lastIndex));

    return <Mono>{parts}</Mono>;
};

/** Preview line: key(?): type with syntax-highlighted type, all monospace. */
export const AttributeKeyTypePreview = ({
    keyName,
    isOptional,
    typeStr,
}: {
    keyName: string;
    isOptional: boolean;
    typeStr: string;
}) => (
    <Mono>
        {keyName || 'key'}
        {isOptional ? '?' : ''}: <SyntaxHighlightedType typeStr={typeStr} />
    </Mono>
);

export const AttributeTypeReferenceTooltipContent = () => (
    <Column gap={4}>
        {ATTRIBUTE_TYPE_REFERENCE_ITEMS.map(({ type, description }) => (
            <Row key={type} alignItems="center">
                <SyntaxHighlightedType typeStr={type} />
                <Text typographyStyle="body-sm">: {description}</Text>
            </Row>
        ))}
    </Column>
);
