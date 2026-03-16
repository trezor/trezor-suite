import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import {
    BUTTON_COLOR_SCHEMES,
    BUTTON_SIZES,
    Button as ButtonComponent,
    type ButtonProps,
} from '../../Button/Button';

type ButtonStory = StoryObj<ButtonProps>;

const meta: Meta<ButtonProps> = {
    title: 'Atoms/Buttons',
    component: ButtonComponent,
};

export default meta;

export const Button: ButtonStory = {
    args: {
        children: 'Press me',
        viewLeft: 'magnifyingGlass',
        colorScheme: 'primary',
        size: 'medium',
    },
    argTypes: {
        children: {
            type: 'string',
        },
        colorScheme: {
            control: { type: 'select' },
            options: BUTTON_COLOR_SCHEMES,
        },
        size: {
            control: { type: 'select' },
            options: BUTTON_SIZES,
        },
        viewLeft: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        viewRight: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        isDisabled: {
            control: { type: 'boolean' },
        },
        isLoading: {
            control: { type: 'boolean' },
        },
        isFullWidth: {
            control: { type: 'boolean' },
        },
    },
};
