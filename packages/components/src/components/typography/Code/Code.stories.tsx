import { type Meta, type StoryObj } from '@storybook/react';

import { Code as CodeComponent } from './Code';

const meta: Meta = {
    title: 'Code',
    component: CodeComponent,
};

export default meta;
type Story = StoryObj<typeof CodeComponent>;

export const Code: Story = {
    args: {
        children: 'ABC',
    },
};
