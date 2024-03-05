import { Meta, StoryObj } from '@storybook/react';
import { Spinner as SpinnerComponent, SpinnerProps } from './Spinner';

const meta: Meta = {
    title: 'Loaders/Spinner',
    component: SpinnerComponent,
} as Meta;
export default meta;

export const Spinner: StoryObj<SpinnerProps> = {
    args: {
        size: 50,
    },
    argTypes: {
        className: {
            control: false,
        },
    },
};
