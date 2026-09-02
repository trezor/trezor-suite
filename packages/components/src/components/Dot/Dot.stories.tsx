import { type Meta, type StoryObj } from '@storybook/react';

import { Dot as DotComponent } from './Dot';
import { dotIntents } from './types';

const meta: Meta<typeof DotComponent> = {
    title: 'Dot',
    component: DotComponent,
};
export default meta;

export const Dot: StoryObj<typeof meta> = {
    args: {
        size: 10,
        intent: 'neutral',
    },
    argTypes: {
        size: {
            control: 'number',
        },
        intent: {
            options: dotIntents,
            control: 'select',
        },
        isAnimated: {
            control: 'boolean',
        },
    },
};
