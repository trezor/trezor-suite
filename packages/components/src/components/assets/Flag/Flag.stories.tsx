import { StoryObj } from '@storybook/react';
import { Flag as FlagComponent } from './Flag';

export default {
    title: 'Assets/Flags',
    component: FlagComponent,
};

export const Flag: StoryObj<typeof FlagComponent> = {
    args: { country: 'CZ' },
};
