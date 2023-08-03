import { StoryObj } from '@storybook/react';
import { Flag as FlagComponent } from './Flag';

export default {
    title: 'Misc/Flags/Flag',
    component: FlagComponent,
};

export const Flag: StoryObj<typeof FlagComponent> = {
    args: { country: 'CZ' },
};
