import { Fragment, type JSX } from 'react';

import styled from 'styled-components';

import { Box, Column, Row, Table, Text } from '@trezor/components';

import { AddedBadge } from './AddedBadge';
import { Changelog } from './Changelog';
import { HighlightedText } from './HighlightedText';
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
    query: string;
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

const renderRuntimeTypeLine = (line: string, query: string) => {
    const parts: JSX.Element[] = [];
    const re =
        /'([^'\\]|\\.)*'|"([^"\\]|\\.)*"|\b(string|number|boolean|bigint|symbol|null|undefined|unknown|any|never|object)\b|\b\d+(?:\.\d+)?\b/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const pushText = (text: string, key: string, color?: string) => {
        const content = <HighlightedText text={text} query={query} />;
        parts.push(
            color ? (
                <span key={key} style={{ color }}>
                    {content}
                </span>
            ) : (
                <Fragment key={key}>{content}</Fragment>
            ),
        );
    };

    while ((match = re.exec(line)) !== null) {
        const [token] = match;
        if (match.index > lastIndex) {
            pushText(line.slice(lastIndex, match.index), `${match.index}-gap`);
        }
        if (token.startsWith("'") || token.startsWith('"')) {
            pushText(token, `${match.index}-${token}`, '#6A8759');
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
            pushText(token, `${match.index}-${token}`, '#CC7832');
        } else if (/^\d/.test(token)) {
            pushText(token, `${match.index}-${token}`, '#6897BB');
        } else {
            pushText(token, `${match.index}-${token}`);
        }
        lastIndex = match.index + token.length;
    }

    if (lastIndex < line.length) {
        pushText(line.slice(lastIndex), `${lastIndex}-end`);
    }

    return parts;
};

const renderRuntimeType = (runtimeType: string | undefined, query: string) => {
    const formatted = formatRuntimeType(runtimeType);
    if (formatted === '—') return '—';

    const lines = formatted.split('\n');

    return lines.map((line, idx) => (
        <span key={`${idx}-${line}`}>
            {renderRuntimeTypeLine(line, query)}
            {idx < lines.length - 1 && <br />}
        </span>
    ));
};

export const AttributesTableRow = ({
    attributeKey,
    attributes,
    query,
}: AttributesTableRowProps) => {
    const attribute = attributes[attributeKey];
    const { ChangelogButton, isChangelogOpened } = useChangelogButton();
    if (!attribute) return null;
    const { changelog } = attribute;

    return (
        <>
            <Table.Row key={attributeKey} verticalAlign="top">
                <Table.Cell width={200}>
                    <Text typographyStyle="body-xs" isMonospaced overflow="auto">
                        <HighlightedText text={attributeKey} query={query} />
                    </Text>
                </Table.Cell>
                <Table.Cell>
                    <Text typographyStyle="body-xs" overflow="auto">
                        <Syntax>{renderRuntimeType(attribute.runtimeType, query)}</Syntax>
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
                        <Markdown query={query}>{attribute.description}</Markdown>
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
