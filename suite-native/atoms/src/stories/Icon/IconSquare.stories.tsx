import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_SIZES } from '@suite-native/icons';

import {
    ICON_SQUARE_INTENTS,
    IconSquare as IconSquareComponent,
    type IconSquareProps,
} from '../../Icon/IconSquare';

type IconSquareStory = StoryObj<IconSquareProps>;

const meta: Meta<IconSquareProps> = {
    title: 'Atoms/Icons',
    component: IconSquareComponent,
};

export default meta;

export const IconSquare: IconSquareStory = {
    name: 'IconSquare',
    args: {
        iconNumber: 1,
        intent: 'neutral',
        iconSize: 'mediumLarge',
    },
    argTypes: {
        iconNumber: {
            control: { type: 'number' },
        },
        intent: {
            control: { type: 'select' },
            options: ICON_SQUARE_INTENTS,
        },
        iconSize: {
            control: { type: 'select' },
            options: Object.values(ICON_SIZES),
        },
    },
};
