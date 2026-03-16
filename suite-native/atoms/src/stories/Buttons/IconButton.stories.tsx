import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import { BUTTON_COLOR_SCHEMES, BUTTON_SIZES } from '../../Button/Button';
import { IconButton as IconButtonComponent, type IconButtonProps } from '../../Button/IconButton';

type IconButtonStory = StoryObj<IconButtonProps>;

const meta: Meta<IconButtonProps> = {
    title: 'Atoms/Buttons',
    component: IconButtonComponent,
};

export default meta;

export const IconButton: IconButtonStory = {
    args: { colorScheme: 'primary', size: 'medium', iconName: 'magnifyingGlass' },
    argTypes: {
        iconName: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        colorScheme: {
            control: { type: 'select' },
            options: BUTTON_COLOR_SCHEMES,
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
    },
};
