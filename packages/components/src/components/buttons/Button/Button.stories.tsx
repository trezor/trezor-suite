import { Meta, StoryObj } from '@storybook/react';
import { Button as ButtonComponent, ButtonProps } from './Button';
import { framePropsStory } from '../../common/frameProps';

const meta: Meta = {
    title: 'Buttons/Button',
    component: ButtonComponent,
} as Meta;
export default meta;

export const Button: StoryObj<ButtonProps> = {
    args: {
        children: 'Button label',
        ...framePropsStory.args,
    },
    argTypes: framePropsStory.argTypes,
};
