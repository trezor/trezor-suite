import { Badge, Box, Card, Table, Text } from '@trezor/components';

import type { AttributeDoc } from '../types';
import { AttributesTableRow } from './AttributesTableRow';

export const AttributesTable = ({ attributes }: { attributes: Record<string, AttributeDoc> }) => {
    const keys = Object.keys(attributes);

    if (keys.length === 0) {
        return null;
    }

    return (
        <Box margin={{ bottom: 8, top: 16 }}>
            <Card paddingType="none">
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell>
                                <Text typographyStyle="body-xs">
                                    Attribute{' '}
                                    <Badge intent="info" size="small" margin={{ left: 4 }}>
                                        {keys.length}
                                    </Badge>
                                </Text>
                            </Table.Cell>
                            <Table.Cell>
                                <Text typographyStyle="body-xs">Type</Text>
                            </Table.Cell>
                            <Table.Cell>
                                <Text typographyStyle="body-xs">Version</Text>
                            </Table.Cell>
                            <Table.Cell>
                                <Text typographyStyle="body-xs">Description</Text>
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
            </Card>
        </Box>
    );
};
