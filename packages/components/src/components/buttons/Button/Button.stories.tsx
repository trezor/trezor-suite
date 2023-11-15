import { Meta, StoryObj } from '@storybook/react';
import { Button as ButtonComponent, ButtonProps } from './Button';

export default {
    title: 'Buttons/Button',
    component: ButtonComponent,
} as Meta;

export const Button: StoryObj<ButtonProps> = {
    args: {
        children: 'Button label',
    },
};
