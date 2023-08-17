import { StoryObj } from '@storybook/react';
import { Button as ButtonComponent } from './Button';

export default {
    title: 'Buttons/Button',
    component: ButtonComponent,
};

export const Button: StoryObj = {
    args: {
        children: 'Button label',
    },
};
