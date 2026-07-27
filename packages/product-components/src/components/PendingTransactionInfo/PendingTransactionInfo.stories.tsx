import { IntlProvider } from 'react-intl';

import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { PendingTransactionInfo as PendingTransactionInfoComponent } from './PendingTransactionInfo';

type StoryArgs = {
    title: string;
    txidLabel: string;
    txidComponent: string;
    timeEstimateSeconds?: number;
    hasLink: boolean;
};

const meta: Meta<StoryArgs> = {
    title: 'PendingTransactionInfo',
    decorators: [
        (Story: React.FC) => (
            <IntlProvider locale="en">
                <Story />
            </IntlProvider>
        ),
    ],
    component: PendingTransactionInfoComponent,
};

export default meta;

export const PendingTransactionInfo: StoryObj<StoryArgs> = {
    args: {
        title: 'Confirming approval...',
        txidLabel: 'Transaction ID',
        txidComponent: '0x1234...5678',
        timeEstimateSeconds: 30,
        hasLink: true,
    },
    argTypes: {
        hasLink: { control: 'boolean' },
        timeEstimateSeconds: { control: 'number' },
    },
    render: ({ hasLink, ...args }) => (
        <PendingTransactionInfoComponent
            {...args}
            onTxClick={hasLink ? action('onTxClick') : undefined}
        />
    ),
};
