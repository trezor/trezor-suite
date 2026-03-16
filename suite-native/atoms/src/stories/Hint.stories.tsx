import type { Meta, StoryObj } from '@storybook/react-native';

import { HINT_VARIANTS, Hint as HintComponent, type HintProps } from '../Hint';

type HintStory = StoryObj<HintProps>;

const meta: Meta<HintProps> = {
    title: 'Atoms',
    component: HintComponent,
};

export default meta;

export const Hint: HintStory = {
    name: 'Hint',
    args: {
        variant: 'hint',
        children: 'Hint message',
    },
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: HINT_VARIANTS,
        },
        children: {
            control: { type: 'text' },
        },
    },
};
