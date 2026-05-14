import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react-native';
import { action } from 'storybook/actions';

import { ICON_NAMES } from '@suite-native/icons';

import { TextButton as TextButtonComponent, type TextButtonProps } from '../../Button/TextButton';
import { BUTTON_INTENTS, BUTTON_PRIORITIES, TEXT_BUTTON_SIZES } from '../../Button/types';

type TextButtonStory = StoryObj<TextButtonProps>;

const meta: Meta<typeof TextButtonComponent> = {
    title: 'Atoms/Buttons/TextButton',
    component: TextButtonComponent,
    render: args => (
        <View style={{ width: '100%', alignItems: 'flex-start' }}>
            <TextButtonComponent {...args} key={`${args.intent}-${args.priority}-${args.size}`} />
        </View>
    ),
};

export default meta;

export const TextButton: TextButtonStory = {
    args: {
        children: 'Button label',
        onPress: action('onPress'),
        intent: 'brand',
        priority: 'primary',
        size: 'large',
        isInverse: false,
        isDisabled: false,
        isLoading: false,
        isUnderlined: false,
        iconLeft: undefined,
        iconRight: undefined,
    },
    argTypes: {
        children: {
            type: 'string',
        },
        intent: {
            control: { type: 'select' },
            options: BUTTON_INTENTS,
        },
        priority: {
            control: { type: 'select' },
            options: BUTTON_PRIORITIES,
        },
        size: {
            control: { type: 'select' },
            options: TEXT_BUTTON_SIZES,
        },
        style: {
            table: { disable: true },
        },
        isInverse: {
            control: { type: 'boolean' },
        },
        isDisabled: {
            control: { type: 'boolean' },
        },
        isLoading: {
            control: { type: 'boolean' },
        },
        iconLeft: {
            control: { type: 'select' },
            options: [undefined, ...ICON_NAMES],
        },
        iconRight: {
            control: { type: 'select' },
            options: [undefined, ...ICON_NAMES],
        },
        isUnderlined: {
            control: { type: 'boolean' },
        },
        testID: {
            table: { disable: true },
        },
    },
};
