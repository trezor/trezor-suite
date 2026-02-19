import type { ReactNode } from 'react';

import { Column, Row, Text } from '@trezor/components';

import { ATTRIBUTE_TYPE_REFERENCE_ITEMS } from './constants';

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
                <span key={match.index} style={{ color: '#6A8759' }}>
                    {token}
                </span>,
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
                <span key={match.index} style={{ color: '#CC7832' }}>
                    {token}
                </span>,
            );
        } else if (/^\d/.test(token)) {
            parts.push(
                <span key={match.index} style={{ color: '#6897BB' }}>
                    {token}
                </span>,
            );
        } else {
            parts.push(token);
        }
        lastIndex = match.index + token.length;
    }
    if (lastIndex < typeStr.length) parts.push(typeStr.slice(lastIndex));

    return <span style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>{parts}</span>;
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
    <span style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>
        {keyName || 'key'}
        {isOptional ? '?' : ''}: <SyntaxHighlightedType typeStr={typeStr} />
    </span>
);

export const AttributeTypeReferenceTooltipContent = () => (
    <Column gap={4}>
        {ATTRIBUTE_TYPE_REFERENCE_ITEMS.map(({ type, description }) => (
            <Row key={type} gap={8} alignItems="center">
                <SyntaxHighlightedType typeStr={type} />
                <Text typographyStyle="hint">— {description}</Text>
            </Row>
        ))}
    </Column>
);
