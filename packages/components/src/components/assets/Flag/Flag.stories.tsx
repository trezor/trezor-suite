import { Meta, StoryObj } from '@storybook/react';
import { Flag as FlagComponent } from './Flag';

export default {
    title: 'Assets/Flags',
    component: FlagComponent,
} as Meta;

export const Flag: StoryObj<typeof FlagComponent> = {
    args: { country: 'CZ' },
};
