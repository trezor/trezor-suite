import { Meta, StoryObj } from '@storybook/react';
import { Code } from './Code';

const meta: Meta = {
    title: 'Code',
    component: Code,
};

export default meta;
type Story = StoryObj<typeof Code>;

export const Default: Story = {
    args: {
        children: 'ABC',
    },
};
