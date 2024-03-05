import { Meta, StoryObj } from '@storybook/react';
import { TextButton as TextButtonComponent, TextButtonProps } from './TextButton';

const meta: Meta = {
    title: 'Buttons/TextButton',
    component: TextButtonComponent,
} as Meta;
export default meta;

export const TextButton: StoryObj<TextButtonProps> = {
    args: {
        children: 'Button label',
    },
};
