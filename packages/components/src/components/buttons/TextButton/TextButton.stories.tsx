import { Meta, StoryObj } from '@storybook/react';
import { TextButton as TextButtonComponent, TextButtonProps } from './TextButton';

export default {
    title: 'Buttons/TextButton',
    component: TextButtonComponent,
} as Meta;

export const TextButton: StoryObj<TextButtonProps> = {
    args: {
        children: 'Button label',
    },
};
