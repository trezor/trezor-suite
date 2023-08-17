import { StoryObj } from '@storybook/react';
import { IconButton as IconButtonComponent, IconButtonProps } from './IconButton';

export default {
    title: 'Buttons/IconButton',
    component: IconButtonComponent,
};

export const IconButton: StoryObj<IconButtonProps> = {
    args: {
        label: 'label',
        icon: 'ARROW_RIGHT_LONG',
    },
};
