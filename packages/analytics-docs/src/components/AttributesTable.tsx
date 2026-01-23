import styled from 'styled-components';

import { Badge, CollapsibleBox, Table, Text } from '@trezor/components';

import type { AttributeDoc } from '../types';
import { AttributesTableRow } from './AttributesTableRow';

const Wrap = styled.div`
    margin-bottom: 8px;
    margin-top: 16px;
`;

export function AttributesTable({ attributes }: { attributes: Record<string, AttributeDoc> }) {
    const keys = Object.keys(attributes);

    if (keys.length === 0) {
        return null;
    }

    return (
        <Wrap>
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
            >
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell>Attribute</Table.Cell>
                            <Table.Cell>Type</Table.Cell>
                            <Table.Cell>Version</Table.Cell>
                            <Table.Cell>Description</Table.Cell>
                            <Table.Cell></Table.Cell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {keys.map(key => (
                            <AttributesTableRow attributes={attributes} k={key} key={key} />
                        ))}
                    </Table.Body>
                </Table>
            </CollapsibleBox>
        </Wrap>
    );
}
