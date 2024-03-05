import { Meta, StoryObj } from '@storybook/react';
import { Stepper as StepperComponent, StepperProps } from './Stepper';

const meta: Meta = {
    title: 'Loaders/Stepper',
    component: StepperComponent,
} as Meta;
export default meta;

export const Stepper: StoryObj<StepperProps> = {
    args: {
        step: 2,
        total: 5,
    },
};
