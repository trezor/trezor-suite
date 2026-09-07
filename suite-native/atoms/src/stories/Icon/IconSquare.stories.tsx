import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_SIZES } from '@suite-native/icons';
import { COLOR_TOKENS, nativeBorders } from '@trezor/theme';

import { IconSquare as IconSquareComponent, type IconSquareProps } from '../../Icon/IconSquare';

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
        iconBorderRadius: 'r12',
        iconColor: 'contentPrimary',
        iconSize: 'mediumLarge',
    },
    argTypes: {
        iconNumber: {
            control: { type: 'number' },
        },
        iconBackgroundColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        iconBorderColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        iconBorderRadius: {
            control: { type: 'select' },
            options: Object.keys(nativeBorders.radii),
        },
        iconColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        iconSize: {
            control: { type: 'select' },
            options: Object.values(ICON_SIZES),
        },
    },
};
