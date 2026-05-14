import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { PendingTransactionInfo as PendingTransactionInfoComponent } from './PendingTransactionInfo';

type StoryArgs = {
    title: string;
    txidLabel: string;
    txidComponent: string;
    hasLink: boolean;
};

const meta: Meta<StoryArgs> = {
    title: 'PendingTransactionInfo',
    component: PendingTransactionInfoComponent,
};

export default meta;

export const PendingTransactionInfo: StoryObj<StoryArgs> = {
    args: {
        title: 'Confirming approval...',
        txidLabel: 'Transaction ID',
        txidComponent: '0x1234...5678',
        hasLink: true,
    },
    argTypes: {
        hasLink: { control: 'boolean' },
    },
    render: ({ hasLink, ...args }) => (
        <PendingTransactionInfoComponent
            {...args}
            onTxClick={hasLink ? action('onTxClick') : undefined}
        />
    ),
};
