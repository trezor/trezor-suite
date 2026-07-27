import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react-native';
import { action } from 'storybook/actions';

import { ICON_NAMES } from '@suite-native/icons';

import { Button as ButtonComponent, type ButtonProps } from '../../Button/Button';
import { BUTTON_INTENTS, BUTTON_PRIORITIES, BUTTON_SIZES } from '../../Button/types';

type ButtonStory = StoryObj<ButtonProps>;

const meta: Meta<typeof ButtonComponent> = {
    title: 'Atoms/Buttons/Button',
    component: ButtonComponent,
    render: args => (
        <View style={{ width: '100%', alignItems: 'flex-start' }}>
            <ButtonComponent {...args} />
        </View>
    ),
};

export default meta;

export const Button: ButtonStory = {
    args: {
        children: 'Placeholder',
        onPress: action('onPress'),
        intent: 'brand',
        priority: 'primary',
        size: 'medium',
        isDisabled: false,
        isLoading: false,
        isInverse: false,
        isFullWidth: false,
        flex: undefined,
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
            options: BUTTON_SIZES,
        },
        style: {
            table: { disable: true },
        },
        flex: {
            control: { type: 'number' },
        },
        isDisabled: {
            type: 'boolean',
        },
        isLoading: {
            type: 'boolean',
        },
        isInverse: {
            type: 'boolean',
        },
        iconLeft: {
            control: { type: 'select' },
            options: [undefined, ...ICON_NAMES],
        },
        iconRight: {
            control: { type: 'select' },
            options: [undefined, ...ICON_NAMES],
        },
        isFullWidth: {
            type: 'boolean',
        },
        testID: {
            table: { disable: true },
        },
    },
};
