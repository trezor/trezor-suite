import type { Meta, StoryObj } from '@storybook/react-native';

import {
    ICON_SQUARE_INTENTS,
    ICON_SQUARE_SIZES,
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
        size: 40,
    },
    argTypes: {
        iconNumber: {
            control: { type: 'number' },
        },
        intent: {
            control: { type: 'select' },
            options: ICON_SQUARE_INTENTS,
        },
        size: {
            control: { type: 'select' },
            options: Object.values(ICON_SQUARE_SIZES),
        },
    },
};
