import type { Meta, StoryObj } from '@storybook/react-native';

import { Flag as FlagComponent, type FlagProps } from '../Flag/Flag';
import { FLAGS } from '../Flag/flags';
import { flagSizes } from '../Flag/types';

type FlagStory = StoryObj<FlagProps>;

const meta: Meta<FlagProps> = {
    title: 'Atoms',
    component: FlagComponent,
};

export default meta;

export const Flag: FlagStory = {
    name: 'Flag',
    args: {
        country: 'CZ',
        size: 48,
    },
    argTypes: {
        country: {
            control: { type: 'select' },
            options: Object.keys(FLAGS),
        },
        size: {
            control: { type: 'select' },
            options: flagSizes,
        },
    },
};
