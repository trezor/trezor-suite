import { Meta, StoryObj } from '@storybook/react';
import { Flag as FlagComponent } from './Flag';

const meta: Meta = {
    title: 'Flags',
    component: FlagComponent,
} as Meta;
export default meta;

export const Flag: StoryObj<typeof FlagComponent> = {
    args: { country: 'CZ' },
};
