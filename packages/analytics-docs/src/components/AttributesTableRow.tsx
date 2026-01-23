import { Box, Column, Row, Table, Text } from '@trezor/components';

import { AddedBadge } from './AddedBadge';
import { Changelog } from './Changelog';
import { LastUpdatedBadge } from './LastUpdatedBadge';
import { useChangelogButton } from '../useChangelogButton';
import { Markdown } from './Markdown';
import { AttributeDoc } from '../normalizeEvents';

type AttributesTableRowProps = {
    k: string;
    attributes: Record<string, AttributeDoc>;
};

export const AttributesTableRow = ({ k, attributes }: AttributesTableRowProps) => {
    const attribute = attributes[k];
    const { changelog } = attribute;
    const { ChangelogButton, isChangelogOpened } = useChangelogButton();

    return (
        <>
            <Table.Row key={k} verticalAlign="top">
                <Table.Cell>
                    <Text typographyStyle="label" isMonospaced>
                        {k}
                    </Text>
                </Table.Cell>
                <Table.Cell>
                    <Text typographyStyle="label" isMonospaced>
                        {attribute.runtimeType}
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
                    <Column>
                        <Markdown>{attribute.description}</Markdown>

                        {attribute.limitations && <Markdown>{attribute.limitations}</Markdown>}
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
