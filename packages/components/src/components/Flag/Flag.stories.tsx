import { type Meta, type StoryObj } from '@storybook/react';

import { Flag as FlagComponent } from './Flag';
import { FLAGS } from './flags';
import { flagSizes } from './types';

const meta: Meta<typeof FlagComponent> = {
    title: 'Flags',
    component: FlagComponent,
};
export default meta;

export const Flag: StoryObj<typeof meta> = {
    args: {
        country: 'CZ',
        size: 48,
    },
    argTypes: {
        country: {
            options: Object.keys(FLAGS),
            control: { type: 'select' },
        },
        size: {
            options: flagSizes,
            control: { type: 'select' },
        },
    },
};
