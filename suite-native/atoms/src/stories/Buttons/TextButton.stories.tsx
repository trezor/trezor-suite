import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import { BUTTON_SIZES } from '../../Button/Button';
import {
    TEXT_BUTTON_VARIANTS,
    TextButton as TextButtonComponent,
    type TextButtonProps,
} from '../../Button/TextButton';

type TextButtonStory = StoryObj<TextButtonProps>;

const meta: Meta<TextButtonProps> = {
    title: 'Atoms/Buttons',
    component: TextButtonComponent,
    // Reanimated useSharedValue is used under the hood, so we need to mount the component again when `variant` is changed.
    render: args => <TextButtonComponent {...args} key={args.variant} />, //
};

export default meta;

export const TextButton: TextButtonStory = {
    args: { children: 'Press me', viewLeft: 'magnifyingGlass', variant: 'primary', size: 'medium' },
    argTypes: {
        children: {
            type: 'string',
        },
        variant: {
            control: { type: 'select' },
            options: TEXT_BUTTON_VARIANTS,
        },
        size: {
            control: { type: 'select' },
            options: BUTTON_SIZES,
        },
        isDisabled: {
            control: { type: 'boolean' },
        },
        isLoading: {
            control: { type: 'boolean' },
        },
        viewLeft: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        viewRight: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        isUnderlined: {
            control: { type: 'boolean' },
        },
        isBold: {
            control: { type: 'boolean' },
        },
        justifyContent: {
            control: { type: 'select' },
            options: [
                'flex-start',
                'center',
                'flex-end',
                'space-between',
                'space-around',
                'space-evenly',
            ],
        },
    },
};
