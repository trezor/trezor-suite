import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import {
    TEXT_BUTTON_INTENTS,
    TEXT_BUTTON_SIZES,
    TextButton as TextButtonComponent,
    TextButtonProps,
} from '../../Button/TextButton';

type TextButtonStory = StoryObj<TextButtonProps>;

const meta: Meta<TextButtonProps> = {
    title: 'Atoms/Buttons',
    component: TextButtonComponent,
    // Reanimated useSharedValue is used under the hood, so we need to mount the component again when `intent` is changed.
    render: args => <TextButtonComponent {...args} key={args.intent} />, //
};

export default meta;

export const TextButton: TextButtonStory = {
    args: {
        children: 'Press me',
        iconLeft: 'magnifyingGlass',
        intent: 'neutralPrimary',
        size: 'medium',
    },
    argTypes: {
        children: {
            type: 'string',
        },
        intent: {
            control: { type: 'select' },
            options: TEXT_BUTTON_INTENTS,
        },
        size: {
            control: { type: 'select' },
            options: TEXT_BUTTON_SIZES,
        },
        isDisabled: {
            control: { type: 'boolean' },
        },
        isLoading: {
            control: { type: 'boolean' },
        },
        iconLeft: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        iconRight: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        isUnderlined: {
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
