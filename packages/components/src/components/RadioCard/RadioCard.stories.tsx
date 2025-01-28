import { Meta, StoryObj } from '@storybook/react';

import { RadioCard as RadioCardComponent, RadioCardProps } from './RadioCard';

const meta: Meta = {
    title: 'RadioCard',
    component: RadioCardComponent,
} as Meta;
export default meta;

export const RadioCard: StoryObj<RadioCardProps> = {
    args: {
        isActive: true,
        children: 'Content',
    },
    argTypes: {
        isActive: {
            control: {
                type: 'boolean',
            },
        },
    },
};
