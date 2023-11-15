import { Meta, StoryObj } from '@storybook/react';
import { Stepper as StepperComponent, StepperProps } from './Stepper';

export default {
    title: 'Loaders/Stepper',
    component: StepperComponent,
} as Meta;

export const Stepper: StoryObj<StepperProps> = {
    args: {
        step: 2,
        total: 5,
    },
};
