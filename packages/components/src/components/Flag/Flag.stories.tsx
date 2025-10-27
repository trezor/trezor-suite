import { Meta, StoryObj } from '@storybook/react';

import { Flag as FlagComponent } from './Flag';

const meta: Meta<typeof FlagComponent> = {
    title: 'Flags',
    component: FlagComponent,
};
export default meta;

export const Flag: StoryObj<typeof meta> = {
    args: { country: 'CZ' },
};
