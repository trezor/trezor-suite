import { StoryObj } from '@storybook/react';
import { Spinner as SpinnerComponent } from './Spinner';

export default {
    title: 'Loaders/Spinner',
    component: SpinnerComponent,
};

export const Spinner: StoryObj = {
    args: {
        size: 50,
    },
    argTypes: {
        className: {
            control: false,
        },
    },
};
