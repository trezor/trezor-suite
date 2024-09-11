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

export const Table: StoryObj = {
    render: props => (
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
                    <TableComponent.Row key={i}>
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
    },
    argTypes: {
        ...getFramePropsStory(allowedTableFrameProps).argTypes,
    },
};
