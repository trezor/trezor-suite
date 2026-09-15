import type { Meta, StoryObj } from '@storybook/react-native';

import { icons } from '@suite-native/icons';

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
        icon: 'flagCheckered',
        intent: 'neutral',
        size: 40,
    },
    argTypes: {
        icon: {
            control: { type: 'select' },
            options: [1, 2, 3, 4, 5, 6, 7, 8, 9, ...Object.keys(icons)],
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
