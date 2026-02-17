import { Badge, Box, CollapsibleBox, Table, Text } from '@trezor/components';

import type { AttributeDoc } from '../types';
import { AttributesTableRow } from './AttributesTableRow';

export const AttributesTable = ({ attributes }: { attributes: Record<string, AttributeDoc> }) => {
    const keys = Object.keys(attributes);

    if (keys.length === 0) {
        return null;
    }

    return (
        <Box margin={{ bottom: 8, top: 16 }}>
            <CollapsibleBox
                heading={
                    <>
                        <Text typographyStyle="hint">Attributes </Text>
                        <Badge intent="info" size="small" margin={{ left: 4 }}>
                            {keys.length}
                        </Badge>
                    </>
                }
                paddingType="small"
                defaultIsOpen={true}
            >
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell>
                                <Text typographyStyle="label">Attribute</Text>
                            </Table.Cell>
                            <Table.Cell>
                                <Text typographyStyle="label">Type</Text>
                            </Table.Cell>
                            <Table.Cell>
                                <Text typographyStyle="label">Version</Text>
                            </Table.Cell>
                            <Table.Cell>
                                <Text typographyStyle="label">Description</Text>
                            </Table.Cell>
                            <Table.Cell></Table.Cell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {keys.map(key => (
                            <AttributesTableRow
                                attributes={attributes}
                                attributeKey={key}
                                key={key}
                            />
                        ))}
                    </Table.Body>
                </Table>
            </CollapsibleBox>
        </Box>
    );
};
