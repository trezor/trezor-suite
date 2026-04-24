import type { Meta, StoryObj } from '@storybook/react-native';

import { FLAGS, flagSizes } from '@suite-common/flags';

import { Flag as FlagComponent, type FlagProps } from '../Flag/Flag';

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
