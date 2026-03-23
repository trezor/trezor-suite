import { type JSX } from 'react';

import styled from 'styled-components';

import { Box, Column, Row, Table, Text } from '@trezor/components';

import { AddedBadge } from './AddedBadge';
import { Changelog } from './Changelog';
import { LastUpdatedBadge } from './LastUpdatedBadge';
import { Markdown } from './Markdown';
import type { AttributeDoc } from '../types';
import { useChangelogButton } from '../utils/useChangelogButton';

const Syntax = styled.span`
    * {
        white-space: pre;
        font-family: monospace;
        font-size: inherit;
    }
`;

type AttributesTableRowProps = {
    attributeKey: string;
    attributes: Record<string, AttributeDoc>;
};

const formatRuntimeType = (t?: string) => {
    if (!t) return '—';
    const normalized = t.replace(/\r\n/g, '\n').trim();
    if (!normalized) return '—';

    if (normalized.includes('\n| ')) return normalized;

    const parts = normalized.split(' | ');
    if (parts.length > 2) return parts.join('\n| ');

    return normalized;
};

const renderRuntimeTypeLine = (line: string) => {
    const parts: Array<string | JSX.Element> = [];
    const re =
        /'([^'\\]|\\.)*'|"([^"\\]|\\.)*"|\b(string|number|boolean|bigint|symbol|null|undefined|unknown|any|never|object)\b|\b\d+(?:\.\d+)?\b/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = re.exec(line)) !== null) {
        const [token] = match;
        if (match.index > lastIndex) {
            parts.push(line.slice(lastIndex, match.index));
        }
        if (token.startsWith("'") || token.startsWith('"')) {
            parts.push(
                <span key={`${match.index}-${token}`} style={{ color: '#6A8759' }}>
                    {token}
                </span>,
            );
        } else if (
            token === 'string' ||
            token === 'number' ||
            token === 'boolean' ||
            token === 'bigint' ||
            token === 'symbol' ||
            token === 'null' ||
            token === 'undefined' ||
            token === 'unknown' ||
            token === 'any' ||
            token === 'never' ||
            token === 'object'
        ) {
            parts.push(
                <span key={`${match.index}-${token}`} style={{ color: '#CC7832' }}>
                    {token}
                </span>,
            );
        } else if (/^\d/.test(token)) {
            parts.push(
                <span key={`${match.index}-${token}`} style={{ color: '#6897BB' }}>
                    {token}
                </span>,
            );
        } else {
            parts.push(token);
        }
        lastIndex = match.index + token.length;
    }

    if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
    }

    return parts;
};

const renderRuntimeType = (t?: string) => {
    const formatted = formatRuntimeType(t);
    if (formatted === '—') return '—';

    const lines = formatted.split('\n');

    return lines.map((line, idx) => (
        <span key={`${idx}-${line}`}>
            {renderRuntimeTypeLine(line)}
            {idx < lines.length - 1 && <br />}
        </span>
    ));
};

export const AttributesTableRow = ({ attributeKey, attributes }: AttributesTableRowProps) => {
    const attribute = attributes[attributeKey];
    const { changelog } = attribute;
    const { ChangelogButton, isChangelogOpened } = useChangelogButton();

    return (
        <>
            <Table.Row key={attributeKey} verticalAlign="top">
                <Table.Cell width={200}>
                    <Text typographyStyle="body-xs" isMonospaced overflow="auto">
                        {attributeKey}
                    </Text>
                </Table.Cell>
                <Table.Cell>
                    <Text typographyStyle="body-xs" overflow="auto">
                        <Syntax>{renderRuntimeType(attribute.runtimeType)}</Syntax>
                    </Text>
                </Table.Cell>

                <Table.Cell>
                    <Row gap={4}>
                        <AddedBadge>{attribute.changelog.addedInVersion}</AddedBadge>
                        <LastUpdatedBadge>
                            {attribute.changelog.lastUpdatedInVersion}
                        </LastUpdatedBadge>
                    </Row>
                </Table.Cell>
                <Table.Cell>
                    <Column overflow="auto">
                        <Markdown>{attribute.description}</Markdown>
                    </Column>
                </Table.Cell>
                <Table.Cell align="end">
                    {changelog.entries.length > 1 && <ChangelogButton />}
                </Table.Cell>
            </Table.Row>
            {isChangelogOpened && (
                <Table.Row>
                    <Table.Cell colSpan={5} padding={0}>
                        <Box margin={{ top: 8 }}>
                            <Changelog>{changelog}</Changelog>
                        </Box>
                    </Table.Cell>
                </Table.Row>
            )}
        </>
    );
};
