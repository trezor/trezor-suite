import type { Meta, StoryObj } from '@storybook/react-native';

import { icons } from '@suite-native/icons';

import {
    ICON_CIRCLE_INTENTS,
    ICON_CIRCLE_SIZES,
    IconCircle as IconCircleComponent,
    type IconCircleProps,
} from '../../Icon/IconCircle';

type IconCircleStory = StoryObj<IconCircleProps>;

const meta: Meta<IconCircleProps> = {
    title: 'Atoms/Icons',
    component: IconCircleComponent,
};

export default meta;

export const IconCircle: IconCircleStory = {
    name: 'IconCircle',
    args: {
        name: 'flag',
        intent: 'neutral',
        size: 48,
    },
    argTypes: {
        name: {
            control: { type: 'select' },
            options: Object.keys(icons),
        },
        intent: {
            control: { type: 'select' },
            options: ICON_CIRCLE_INTENTS,
        },
        size: {
            control: { type: 'select' },
            options: ICON_CIRCLE_SIZES,
        },
    },
};
