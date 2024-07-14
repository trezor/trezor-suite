import { Meta, StoryObj } from '@storybook/react';
import { Spinner as SpinnerComponent, SpinnerProps } from './Spinner';

const meta: Meta = {
    title: 'Loaders/Spinner',
    component: SpinnerComponent,
} as Meta;
export default meta;

export const Default: StoryObj<SpinnerProps> = {
    args: {
        size: 50,
    },
    argTypes: {
        className: {
            control: false,
        },
    },
};

export const Success: StoryObj<SpinnerProps> = {
    args: {
        size: 50,
        hasFinished: true,
        hasStartAnimation: true,
    },
    argTypes: {
        className: {
            control: false,
        },
    },
};

export const Error: StoryObj<SpinnerProps> = {
    args: {
        size: 50,
        hasError: true,
        hasStartAnimation: true,
    },
    argTypes: {
        className: {
            control: false,
        },
    },
};
