import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react-native';
import { action } from 'storybook/actions';

import { ICON_NAMES } from '@suite-native/icons';

import { IconButton as IconButtonComponent, type IconButtonProps } from '../../Button/IconButton';
import { BUTTON_INTENTS, BUTTON_PRIORITIES, BUTTON_SIZES } from '../../Button/types';

type IconButtonStory = StoryObj<IconButtonProps>;

const meta: Meta<typeof IconButtonComponent> = {
    title: 'Atoms/Buttons/IconButton',
    component: IconButtonComponent,
    render: args => (
        <View style={{ width: '100%', alignItems: 'flex-start' }}>
            <IconButtonComponent {...args} />
        </View>
    ),
};

export default meta;

export const IconButton: IconButtonStory = {
    args: {
        onPress: action('onPress'),
        iconName: 'magnifyingGlass',
        intent: 'brand',
        priority: 'primary',
        size: 'medium',
        isDisabled: false,
        isLoading: false,
        isInverse: false,
    },
    argTypes: {
        iconName: {
            control: { type: 'select' },
            options: ICON_NAMES,
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
        isInverse: {
            control: { type: 'boolean' },
        },
        isDisabled: {
            control: { type: 'boolean' },
        },
        isLoading: {
            control: { type: 'boolean' },
        },
        testID: {
            table: { disable: true },
        },
    },
};
