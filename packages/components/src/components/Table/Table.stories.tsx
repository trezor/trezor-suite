import { Meta, StoryObj } from '@storybook/react';

import { Table as TableComponent, allowedTableFrameProps } from './Table';
import { getFramePropsStory } from '../../utils/frameProps';

const EXAMPLE_TOKENS = [
    { name: 'USDT', balance: '10', price: '$1,00' },
    { name: 'USDC', balance: '100', price: '$1,00' },
    { name: 'MANA', balance: '20', price: '$2,15' },
];

const meta: Meta = {
    title: 'Table',
} as Meta;
export default meta;

interface TableProps {
    colWidths?: { minWidth?: string | undefined; maxWidth?: string | undefined }[];
    isRowHighlightedOnHover?: boolean;
}

export const Table: StoryObj = {
    render: (props: TableProps) => (
        <TableComponent {...props}>
            <TableComponent.Header>
                <TableComponent.Row>
                    <TableComponent.Cell>Token</TableComponent.Cell>
                    <TableComponent.Cell>Balance</TableComponent.Cell>
                    <TableComponent.Cell align="right">Price</TableComponent.Cell>
                </TableComponent.Row>
            </TableComponent.Header>
            <TableComponent.Body>
                {EXAMPLE_TOKENS.map((token, i) => (
                    <TableComponent.Row
                        key={i}
                        onClick={props.isRowHighlightedOnHover ? () => {} : undefined}
                    >
                        <TableComponent.Cell>{token.name}</TableComponent.Cell>
                        <TableComponent.Cell>{token.balance}</TableComponent.Cell>
                        <TableComponent.Cell align="right">{token.price}</TableComponent.Cell>
                    </TableComponent.Row>
                ))}
            </TableComponent.Body>
        </TableComponent>
    ),
    args: {
        ...getFramePropsStory(allowedTableFrameProps).args,
        colWidths: 'none',
        isRowHighlightedOnHover: true,
    },
    argTypes: {
        ...getFramePropsStory(allowedTableFrameProps).argTypes,
        colWidths: {
            options: ['none', 'secondCol300px'],
            mapping: {
                none: undefined,
                secondCol300px: [{}, { minWidth: '300px', maxWidth: '300px' }],
            },
            control: {
                type: 'select',
                labels: {
                    none: 'undefined',
                    secondCol300px: 'second column 300px',
                },
            },
        },
        isRowHighlightedOnHover: {
            control: {
                type: 'boolean',
            },
        },
    },
};
